import type { PayChannel } from "@/server/domain";

process.env.LIGHTQUANT_DATA_MODE = "mock";

console.log("LightQuant payment runtime config guard smoke test");
console.log(
  JSON.stringify(
    {
      dataMode: process.env.LIGHTQUANT_DATA_MODE,
      note:
        "This smoke verifies runtime payment-channel availability uses the same strict config checks as order creation. It does not print secrets or connect to payment providers."
    },
    null,
    2
  )
);

main().catch((error) => {
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
});

async function main() {
  const alipayHttpNotify = await verifyAlipayHttpNotifyGuard();
  const alipayHttpReturn = await verifyAlipayHttpReturnGuard();
  const wechatBadApiKey = await verifyWechatBadApiKeyGuard();

  console.log(
    JSON.stringify(
      {
        ok: true,
        alipayHttpNotify,
        alipayHttpReturn,
        wechatBadApiKey
      },
      null,
      2
    )
  );
}

async function verifyAlipayHttpNotifyGuard() {
  setAlipayEnv({
    notifyBaseUrl: "http://pay.example.com",
    returnBaseUrl: "https://app.example.com"
  });

  return verifyGuard({
    label: "alipay-http-notify",
    payChannel: "alipay"
  });
}

async function verifyAlipayHttpReturnGuard() {
  setAlipayEnv({
    notifyBaseUrl: "https://pay.example.com",
    returnBaseUrl: "http://app.example.com"
  });

  return verifyGuard({
    label: "alipay-http-return",
    payChannel: "alipay"
  });
}

async function verifyWechatBadApiKeyGuard() {
  process.env.LIGHTQUANT_PAYMENT_MODE = "wechat";
  process.env.PAYMENT_MOCK_ENABLED = "false";
  process.env.PAYMENT_NOTIFY_BASE_URL = "https://pay.example.com";
  process.env.WECHAT_PAY_APP_ID = "wx-smoke-config-app";
  process.env.WECHAT_PAY_MCH_ID = "1900000000";
  process.env.WECHAT_PAY_API_KEY = "too-short";
  process.env.WECHAT_PAY_CERT_SERIAL_NO = "SMOKE_CERT_SERIAL";
  process.env.WECHAT_PAY_PRIVATE_KEY = "SMOKE_PRIVATE_KEY";
  process.env.WECHAT_PAY_PLATFORM_CERTIFICATE = "SMOKE_PLATFORM_CERT";
  process.env.WECHAT_PAY_GATEWAY_URL = "https://api.mch.weixin.qq.com";

  return verifyGuard({
    label: "wechat-bad-api-key",
    payChannel: "wechat"
  });
}

async function verifyGuard(input: { label: string; payChannel: PayChannel }) {
  const { assertPayChannelAvailable, listPaymentChannelAvailability } = await import("@/server/payments/payment-config");
  let errorCode = "";

  try {
    assertPayChannelAvailable(input.payChannel);
  } catch (error) {
    errorCode = readErrorCode(error);
  }

  assertEqual(`${input.label}-error-code`, errorCode, "PAYMENT_CONFIG_ERROR");

  const channels = listPaymentChannelAvailability();
  const channel = channels.find((item) => item.id === input.payChannel);

  assertEqual(`${input.label}-availability`, channel?.enabled, false);

  return {
    payChannel: input.payChannel,
    errorCode,
    enabled: channel?.enabled ?? null
  };
}

function setAlipayEnv(input: { notifyBaseUrl: string; returnBaseUrl: string }) {
  process.env.LIGHTQUANT_PAYMENT_MODE = "alipay";
  process.env.PAYMENT_MOCK_ENABLED = "false";
  process.env.PAYMENT_NOTIFY_BASE_URL = input.notifyBaseUrl;
  process.env.PAYMENT_RETURN_BASE_URL = input.returnBaseUrl;
  process.env.ALIPAY_APP_ID = "smoke-config-alipay-app";
  process.env.ALIPAY_PRIVATE_KEY = "SMOKE_PRIVATE_KEY";
  process.env.ALIPAY_PUBLIC_KEY = "SMOKE_PUBLIC_KEY";
  process.env.ALIPAY_GATEWAY_URL = "https://openapi.alipay.com/gateway.do";
}

function readErrorCode(error: unknown) {
  return error && typeof error === "object" && "code" in error ? String(error.code) : "";
}

function assertEqual(step: string, actual: unknown, expected: unknown) {
  if (actual !== expected) {
    throw new Error(`${step} failed: expected=${JSON.stringify(expected)}, actual=${JSON.stringify(actual)}`);
  }
}
