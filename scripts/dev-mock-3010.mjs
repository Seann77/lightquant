import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const nextCli = resolve("node_modules", "next", "dist", "bin", "next");

if (!existsSync(nextCli)) {
  console.error("Next CLI not found. Please run npm install first.");
  process.exit(1);
}

const command = process.execPath;
const args = [nextCli, "dev", "--webpack", "--hostname", "127.0.0.1", "--port", "3010"];

const child = spawn(command, args, {
  env: {
    ...getSafeEnv(),
    LIGHTQUANT_DATA_MODE: "mock",
    LIGHTQUANT_SMS_PROVIDER: "mock",
    LIGHTQUANT_PAYMENT_MODE: "mock",
    PAYMENT_MOCK_ENABLED: "true"
  },
  stdio: "inherit",
  shell: false
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});

function getSafeEnv() {
  return Object.fromEntries(
    Object.entries(process.env).filter(([key, value]) => key && !key.startsWith("=") && value !== undefined)
  );
}
