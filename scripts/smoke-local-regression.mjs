import { spawn } from "node:child_process";

const steps = [
  {
    name: "check:db",
    args: ["run", "check:db"]
  },
  {
    name: "check:ai",
    args: ["run", "check:ai"]
  },
  {
    name: "check:env-example",
    args: ["run", "check:env-example"]
  },
  {
    name: "check:secrets",
    args: ["run", "check:secrets"]
  },
  {
    name: "smoke:ai:config-check",
    args: ["run", "smoke:ai:config-check"]
  },
  {
    name: "smoke:payment:regression",
    args: ["run", "smoke:payment:regression"]
  },
  {
    name: "smoke:ui:pages",
    args: ["run", "smoke:ui:pages"]
  },
  {
    name: "smoke:files:local",
    args: ["run", "smoke:files:local"]
  },
  {
    name: "smoke:admin:local",
    args: ["run", "smoke:admin:local"]
  }
];

const npmExecPath = process.env.npm_execpath;

console.log("LightQuant local non-AI-cost regression suite");
console.log(
  JSON.stringify(
    {
      sequential: true,
      baseUrl: process.env.SMOKE_BASE_URL || process.env.SMOKE_AI_BASE_URL || process.env.SMOKE_FILES_BASE_URL || "http://127.0.0.1:3010",
      steps: steps.map((step) => step.name),
      note:
        "Runs local checks that should not call real LLM providers or real payment providers. It expects the local dev server to be running and does not print secrets."
    },
    null,
    2
  )
);

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
