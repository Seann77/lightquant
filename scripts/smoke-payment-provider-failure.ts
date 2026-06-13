import { generateKeyPairSync } from "node:crypto";

const clientRequestId = `smoke-provider-failure-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const userId = "smoke-provider-failure-user";

process.env.LIGHTQUANT_DATA_MODE = "mock";
process.env.LIGHTQUANT_PAYMENT_MODE = "wechat";
process.env.PAYMENT_MOCK_ENABLED = "false";
process.env.PAYMENT_NOTIFY_BASE_URL = "https://pay.example.com";
process.env.WECHAT_PAY_APP_ID = "wx-smoke-app";
process.env.WECHAT_PAY_MCH_ID = "1900000000";
process.env.WECHAT_PAY_API_KEY = "12345678901234567890123456789012";
process.env.WECHAT_PAY_CERT_SERIAL_NO = "SMOKE_CERT_SERIAL";
process.env.WECHAT_PAY_GATEWAY_URL = "https://api.mch.weixin.qq.com";

const keyPair = generateKeyPairSync("rsa", {
  modulusLength: 2048
});

process.env.WECHAT_PAY_PRIVATE_KEY = keyPair.privateKey.export({
  type: "pkcs8",
  format: "pem"
}).toString();
process.env.WECHAT_PAY_PLATFORM_CERTIFICATE = keyPair.publicKey.export({
  type: "spki",
  format: "pem"
}).toString();

globalThis.fetch = async () =>
  new Response(
    JSON.stringify({
      code: "SYSTEM_ERROR",
      message: "smoke provider failure"
    }),
    {
      status: 502,
      headers: {
        "Content-Type": "application/json"
      }
    }
  );

console.log("LightQuant payment provider failure smoke test");
console.log(
  JSON.stringify(
    {
      dataMode: process.env.LIGHTQUANT_DATA_MODE,
      paymentMode: process.env.LIGHTQUANT_PAYMENT_MODE,
      note:
        "This smoke uses the mock repository and a local failing WeChat provider stub. It does not connect to real payment providers or grant credits."
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
  const { createRechargeOrder } = await import("@/server/billing/billing-service");
  const { getRepository } = await import("@/server/repositories");

  let errorCode = "";

  try {
    await createRechargeOrder(userId, {
      planId: "starter",
      payChannel: "wechat",
      clientRequestId
    });
  } catch (error) {
    errorCode = error && typeof error === "object" && "code" in error ? String(error.code) : "";
  }

  assertEqual("provider-error-code", errorCode, "PAYMENT_PROVIDER_ERROR");

  const repository = getRepository();
  const order = await repository.findRechargeOrderByClientRequestId(userId, clientRequestId);

  if (!order) {
    throw new Error("provider-failure-order missing");
  }

  assertEqual("provider-failure-order-status", order.status, "FAILED");
  assertEqual("provider-failure-order-channel", order.payChannel, "wechat");

  const duplicate = await createRechargeOrder(userId, {
    planId: "starter",
    payChannel: "wechat",
    clientRequestId
  });

  assertEqual("provider-failure-duplicate-flag", duplicate.duplicated, true);
  assertEqual("provider-failure-duplicate-order-id", duplicate.order.id, order.id);
  assertEqual("provider-failure-duplicate-order-status", duplicate.order.status, "FAILED");
  assertEqual("provider-failure-duplicate-payment-action", duplicate.paymentAction, null);
  assertEqual("provider-failure-duplicate-payment", duplicate.payment, null);

  process.env.WECHAT_PAY_API_KEY = "broken-after-order-created";

  const duplicateWithBrokenConfig = await createRechargeOrder(userId, {
    planId: "starter",
    payChannel: "wechat",
    clientRequestId
  });

  assertEqual("provider-failure-broken-config-duplicate-flag", duplicateWithBrokenConfig.duplicated, true);
  assertEqual("provider-failure-broken-config-order-id", duplicateWithBrokenConfig.order.id, order.id);
  assertEqual("provider-failure-broken-config-order-status", duplicateWithBrokenConfig.order.status, "FAILED");
  assertEqual("provider-failure-broken-config-payment-action", duplicateWithBrokenConfig.paymentAction, null);
  assertEqual("provider-failure-broken-config-payment", duplicateWithBrokenConfig.payment, null);

  const transaction = await repository.findLatestPaymentTransactionByOrderId(order.id);

  if (!transaction) {
    throw new Error("provider-failure-transaction missing");
  }

  assertEqual("provider-failure-transaction-status", transaction.status, "FAILED");
  assertEqual("provider-failure-transaction-reason", transaction.failedReason, "PAYMENT_PROVIDER_ERROR");
  assertEqual("provider-failure-order-before", transaction.orderStatusBefore, "PENDING");
  assertEqual("provider-failure-order-after", transaction.orderStatusAfter, "FAILED");

  console.log(
    JSON.stringify(
      {
        ok: true,
        order: {
          id: order.id,
          status: order.status,
          payChannel: order.payChannel,
          duplicateReturnedSameOrder: true,
          duplicateReturnedSameOrderAfterConfigBreak: true
        },
        transaction: {
          status: transaction.status,
          failedReason: transaction.failedReason,
          orderStatusBefore: transaction.orderStatusBefore,
          orderStatusAfter: transaction.orderStatusAfter
        }
      },
      null,
      2
    )
  );
}

function assertEqual(step: string, actual: unknown, expected: unknown) {
  if (actual !== expected) {
    throw new Error(`${step} failed: expected=${JSON.stringify(expected)}, actual=${JSON.stringify(actual)}`);
  }
}
