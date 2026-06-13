import { spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse as parseDotenv } from "dotenv";

const nextCli = resolve("node_modules", "next", "dist", "bin", "next");
const checkDbScript = resolve("scripts", "check-db-connection.mjs");
const useMockServices = process.argv.includes("--mock-services");

if (!existsSync(nextCli)) {
  console.error("Next CLI not found. Please run npm install first.");
  process.exit(1);
}

if (!existsSync(checkDbScript)) {
  console.error("Database check script not found.");
  process.exit(1);
}

const env = {
  ...getSafeEnv(),
  ...readEnvFile(".env"),
  ...readEnvFile(".env.local"),
  LIGHTQUANT_DATA_MODE: "database",
  ...(useMockServices
    ? {
        LIGHTQUANT_SMS_PROVIDER: "mock",
        LIGHTQUANT_PAYMENT_MODE: "mock",
        PAYMENT_MOCK_ENABLED: "true"
      }
    : {})
};

console.log("Checking DATABASE_URL before starting database mode...");
if (useMockServices) {
  console.log("Database mode will use mock SMS and mock payment for local MVP verification.");
}

const check = spawnSync(process.execPath, [checkDbScript], {
  env,
  stdio: "inherit",
  shell: false
});

if (check.status !== 0) {
  console.error("Database mode was not started because the database preflight check failed.");
  process.exit(check.status ?? 1);
}

const child = spawn(process.execPath, [nextCli, "dev", "--webpack", "--hostname", "127.0.0.1", "--port", "3010"], {
  env,
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

function readEnvFile(path) {
  if (!existsSync(path)) {
    return {};
  }

  return parseDotenv(readFileSync(path));
}
