import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const checkScript = resolve(projectRoot, "scripts/check-payment-config.mjs");

console.log("LightQuant payment config check guard smoke test");
console.log(
  JSON.stringify(
    {
      note:
        "This smoke runs check-payment-config.mjs in temporary directories with fake payment configuration. It does not read .env.local or print secrets."
    },
    null,
    2
  )
);

try {
  const alipayHttpReturn = runScenario({
    mode: "alipay",
    envLocal: [
      "LIGHTQUANT_PAYMENT_MODE=alipay",
      "PAYMENT_MOCK_ENABLED=false",
      "PAYMENT_NOTIFY_BASE_URL=https://pay.example.com",
      "PAYMENT_RETURN_BASE_URL=http://app.example.com",
      "ALIPAY_APP_ID=smoke-alipay-app",
      "ALIPAY_PRIVATE_KEY=SMOKE_PRIVATE_KEY",
      "ALIPAY_PUBLIC_KEY=SMOKE_PUBLIC_KEY",
      "ALIPAY_GATEWAY_URL=https://openapi.alipay.com/gateway.do"
    ],
    expectedError: "PAYMENT_RETURN_BASE_URL must use HTTPS when configured for real payment returns."
  });
  const alipayHttpGateway = runScenario({
    mode: "alipay",
    envLocal: [
      "LIGHTQUANT_PAYMENT_MODE=alipay",
      "PAYMENT_MOCK_ENABLED=false",
      "PAYMENT_NOTIFY_BASE_URL=https://pay.example.com",
      "PAYMENT_RETURN_BASE_URL=https://app.example.com",
      "ALIPAY_APP_ID=smoke-alipay-app",
      "ALIPAY_PRIVATE_KEY=SMOKE_PRIVATE_KEY",
      "ALIPAY_PUBLIC_KEY=SMOKE_PUBLIC_KEY",
      "ALIPAY_GATEWAY_URL=http://openapi.alipay.com/gateway.do"
    ],
    expectedError: "ALIPAY_GATEWAY_URL must use HTTPS for real payment provider requests."
  });
  const wechatHttpGateway = runScenario({
    mode: "wechat",
    envLocal: [
      "LIGHTQUANT_PAYMENT_MODE=wechat",
      "PAYMENT_MOCK_ENABLED=false",
      "PAYMENT_NOTIFY_BASE_URL=https://pay.example.com",
      "WECHAT_PAY_APP_ID=wx-smoke-config-check",
      "WECHAT_PAY_MCH_ID=1900000000",
      "WECHAT_PAY_API_KEY=12345678901234567890123456789012",
      "WECHAT_PAY_CERT_SERIAL_NO=SMOKE_MERCHANT_CERT_SERIAL",
      "WECHAT_PAY_PRIVATE_KEY=SMOKE_PRIVATE_KEY",
      "WECHAT_PAY_PLATFORM_CERTIFICATE=SMOKE_PLATFORM_CERT",
      "WECHAT_PAY_GATEWAY_URL=http://api.mch.weixin.qq.com"
    ],
    expectedError: "WECHAT_PAY_GATEWAY_URL must use HTTPS for real payment provider requests."
  });
  const alipayValid = runScenario({
    mode: "alipay",
    envLocal: [
      "LIGHTQUANT_PAYMENT_MODE=alipay",
      "PAYMENT_MOCK_ENABLED=false",
      "PAYMENT_NOTIFY_BASE_URL=https://pay.example.com",
      "PAYMENT_RETURN_BASE_URL=https://app.example.com",
      "ALIPAY_APP_ID=smoke-alipay-app",
      "ALIPAY_PRIVATE_KEY=SMOKE_PRIVATE_KEY",
      "ALIPAY_PUBLIC_KEY=SMOKE_PUBLIC_KEY",
      "ALIPAY_GATEWAY_URL=https://openapi.alipay.com/gateway.do"
    ],
    expectedOk: true
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        alipayHttpReturn,
        alipayHttpGateway,
        wechatHttpGateway,
        alipayValid
      },
      null,
      2
    )
  );
} catch (error) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error)
      },
      null,
      2
    )
  );
  process.exitCode = 1;
}

function runScenario(input) {
  const directory = mkdtempSync(resolve(tmpdir(), "lightquant-payment-config-"));

  try {
    writeFileSync(resolve(directory, ".env.local"), `${input.envLocal.join("\n")}\n`, "utf8");

    const result = spawnSync(process.execPath, [checkScript, "--mode", input.mode], {
      cwd: directory,
      encoding: "utf8",
      env: {
        PATH: process.env.PATH ?? "",
        SystemRoot: process.env.SystemRoot ?? "",
        NODE_ENV: "development"
      }
    });
    const payload = parseJsonOutput(result.stdout);

    if (input.expectedOk) {
      assertEqual(`${input.mode}-valid-exit-code`, result.status, 0);
      assertEqual(`${input.mode}-valid-ok`, payload.ok, true);
      return {
        exitCode: result.status,
        ok: payload.ok,
        errors: payload.errors
      };
    }

    if (result.status === 0) {
      throw new Error(`${input.mode} scenario unexpectedly passed.`);
    }

    if (!Array.isArray(payload.errors) || !payload.errors.includes(input.expectedError)) {
      throw new Error(`${input.mode} scenario did not report expected error.`);
    }

    return {
      exitCode: result.status,
      ok: payload.ok,
      matchedError: input.expectedError
    };
  } finally {
    rmSync(directory, {
      force: true,
      recursive: true
    });
  }
}

function parseJsonOutput(value) {
  try {
    return JSON.parse(value);
  } catch {
    throw new Error("check-payment-config output was not valid JSON.");
  }
}

function assertEqual(step, actual, expected) {
  if (actual !== expected) {
    throw new Error(`${step} failed: expected=${JSON.stringify(expected)}, actual=${JSON.stringify(actual)}`);
  }
}
