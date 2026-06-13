import { spawn } from "node:child_process";

const steps = [
  {
    name: "check:payment",
    args: ["run", "check:payment"]
  },
  {
    name: "check:payment-action:alipay",
    args: ["run", "check:payment-action", "--", "--mode=alipay"]
  },
  {
    name: "smoke:payment:alipay-order",
    args: ["run", "smoke:payment:alipay-order"]
  },
  {
    name: "smoke:payment:return",
    args: ["run", "smoke:payment:return"]
  },
  {
    name: "smoke:payment:alipay-notify",
    args: ["run", "smoke:payment:alipay-notify"]
  },
  {
    name: "smoke:payment:wechat-action",
    args: ["run", "smoke:payment:wechat-action"]
  },
  {
    name: "smoke:payment:wechat-notify",
    args: ["run", "smoke:payment:wechat-notify"]
  },
  {
    name: "smoke:payment:verified-notify-guards",
    args: ["run", "smoke:payment:verified-notify-guards"]
  },
  {
    name: "smoke:payment:notify-routes",
    args: ["run", "smoke:payment:notify-routes"]
  },
  {
    name: "smoke:payment:config-guards",
    args: ["run", "smoke:payment:config-guards"]
  },
  {
    name: "smoke:payment:config-check",
    args: ["run", "smoke:payment:config-check"]
  },
  {
    name: "smoke:payment:config-order-guard",
    args: ["run", "smoke:payment:config-order-guard"]
  },
  {
    name: "smoke:payment:channel-guard",
    args: ["run", "smoke:payment:channel-guard"]
  },
  {
    name: "smoke:payment:provider-failure",
    args: ["run", "smoke:payment:provider-failure"]
  },
  {
    name: "smoke:payment:expired-duplicate",
    args: ["run", "smoke:payment:expired-duplicate"]
  },
  {
    name: "smoke:payment:expired-notify",
    args: ["run", "smoke:payment:expired-notify"]
  },
  {
    name: "smoke:payment:notify",
    args: ["run", "smoke:payment:notify"]
  },
  {
    name: "smoke:payment:maintenance",
    args: ["run", "smoke:payment:maintenance"]
  }
];

const npmExecPath = process.env.npm_execpath;

console.log("LightQuant payment regression smoke suite");
console.log(
  JSON.stringify(
    {
      sequential: true,
      steps: steps.map((step) => step.name),
      note:
        "Runs payment smoke checks sequentially to avoid local dev/database concurrency noise. It does not print secrets."
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
