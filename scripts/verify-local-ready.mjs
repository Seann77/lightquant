import { spawn } from "node:child_process";

const baseUrl = resolveBaseUrl();

const steps = [
  {
    name: "check:quick",
    args: ["run", "check:quick"]
  },
  {
    name: "check:db",
    args: ["run", "check:db"]
  },
  {
    name: "smoke:ui:pages",
    args: ["run", "smoke:ui:pages"]
  }
];

const npmExecPath = process.env.npm_execpath;

console.log("LightQuant local readiness verification");
console.log(
  JSON.stringify(
    {
      sequential: true,
      baseUrl,
      mutatesBusinessData: false,
      callsRealLlms: false,
      callsRealPaymentProviders: false,
      steps: steps.map((step) => step.name),
      note:
        "Use this after starting the dev server to confirm local configuration, database reachability, TypeScript, and core page rendering."
    },
    null,
    2
  )
);

await ensureDevServerReachable(baseUrl);

for (const step of steps) {
  console.log(`\n--- ${step.name} ---`);
  await runStep(step.args);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      completedSteps: steps.length
    },
    null,
    2
  )
);

async function ensureDevServerReachable(url) {
  const startedAt = Date.now();
  const timeoutMs = Number(process.env.VERIFY_LOCAL_PREFLIGHT_TIMEOUT_MS || "60000");
  const intervalMs = Number(process.env.VERIFY_LOCAL_PREFLIGHT_INTERVAL_MS || "2000");
  let lastFailure = null;
  let attempt = 0;

  while (Date.now() - startedAt < timeoutMs) {
    attempt += 1;

    try {
      const response = await fetchWithTimeout(url, 15000);

      if (response.ok) {
        if (attempt > 1) {
          console.log(
            JSON.stringify(
              {
                stage: "dev-server-preflight",
                baseUrl: url,
                ok: true,
                attempts: attempt,
                waitedMs: Date.now() - startedAt
              },
              null,
              2
            )
          );
        }

        return;
      }

      lastFailure = {
        status: response.status
      };
    } catch (error) {
      lastFailure = {
        error: error instanceof Error && error.name === "AbortError" ? "TIMEOUT" : "UNREACHABLE"
      };
    }

    await delay(intervalMs);
  }

  const failure = lastFailure ?? {
    error: "UNREACHABLE"
  };

  if ("status" in failure) {
    console.error(
      JSON.stringify(
        {
          ok: false,
          stage: "dev-server-preflight",
          baseUrl: url,
          status: failure.status,
          attempts: attempt,
          timeoutMs,
          nextAction: startServerHint()
        },
        null,
        2
      )
    );
    process.exit(1);
  }

  console.error(
    JSON.stringify(
      {
        ok: false,
        stage: "dev-server-preflight",
        baseUrl: url,
        error: failure.error,
        attempts: attempt,
        timeoutMs,
        nextAction: startServerHint()
      },
      null,
      2
    )
  );
  process.exit(1);
}

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      headers: {
        accept: "text/html"
      },
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function resolveBaseUrl() {
  const explicitBaseUrl = process.env.SMOKE_BASE_URL?.trim();

  if (explicitBaseUrl) {
    return explicitBaseUrl.replace(/\/$/, "");
  }

  const port = process.env.PORT?.trim() || process.env.APP_PORT?.trim();

  if (port) {
    return `http://127.0.0.1:${port}`.replace(/\/$/, "");
  }

  return "http://127.0.0.1:3010";
}

function startServerHint() {
  return "Start the local dev server first, for example: npm run dev:3010. On a deployed server, pass SMOKE_BASE_URL or PORT to match the running app.";
}

function runStep(args) {
  return new Promise((resolve, reject) => {
    const command = npmExecPath ? process.execPath : process.platform === "win32" ? "npm.cmd" : "npm";
    const commandArgs = npmExecPath ? [npmExecPath, ...args] : args;
    const child = spawn(command, commandArgs, {
      stdio: "inherit",
      shell: false
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${args.join(" ")} exited with ${code ?? "unknown"}`));
    });
  });
}
