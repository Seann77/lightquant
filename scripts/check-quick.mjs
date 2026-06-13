import { spawn } from "node:child_process";

const steps = [
  {
    name: "check:encoding",
    args: ["run", "check:encoding"]
  },
  {
    name: "check:ai-prompts",
    args: ["run", "check:ai-prompts"]
  },
  {
    name: "check:env-example",
    args: ["run", "check:env-example"]
  },
  {
    name: "check:legacy-ai",
    args: ["run", "check:legacy-ai"]
  },
  {
    name: "check:ai-runner",
    args: ["run", "check:ai-runner"]
  },
  {
    name: "check:deploy",
    args: ["run", "check:deploy"]
  },
  {
    name: "check:secrets",
    args: ["run", "check:secrets"]
  },
  {
    name: "check:docs",
    args: ["run", "check:docs"]
  },
  {
    name: "check:ai",
    args: ["run", "check:ai"]
  },
  {
    name: "check:payment",
    args: ["run", "check:payment"]
  },
  {
    name: "prisma validate",
    args: ["run", "db:validate"]
  },
  {
    name: "tsc --noEmit",
    args: ["run", "typecheck"]
  }
];

console.log("LightQuant quick check");
console.log(
  JSON.stringify(
    {
      sequential: true,
      mutatesBusinessData: false,
      callsRealLlms: false,
      callsRealPaymentProviders: false,
      steps: steps.map((step) => step.name),
      note: "Runs local checks that should not create smoke users, orders, uploaded files, AI tasks, or payment notifications."
    },
    null,
    2
  )
);

for (const step of steps) {
  console.log(`\n--- ${step.name} ---`);
  await runStep(step);
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

function runStep(step) {
  return new Promise((resolve, reject) => {
    const npmExecPath = process.env.npm_execpath;
    const command = resolveCommand(step.command, npmExecPath);
    const args = step.command ? step.args : npmExecPath ? [npmExecPath, ...step.args] : step.args;
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: false
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${step.name} exited with ${code ?? "unknown"}`));
    });
  });
}

function resolveCommand(command, npmExecPath) {
  if (command) {
    return command;
  }

  return npmExecPath ? process.execPath : process.platform === "win32" ? "npm.cmd" : "npm";
}
