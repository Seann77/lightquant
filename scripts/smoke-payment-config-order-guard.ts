const userId = "smoke-payment-config-order-guard-user";

process.env.LIGHTQUANT_DATA_MODE = "mock";

console.log("LightQuant payment config order guard smoke test");
console.log(
  JSON.stringify(
    {
      dataMode: process.env.LIGHTQUANT_DATA_MODE,
      note:
        "This smoke verifies incomplete real payment channel configuration fails before creating recharge orders or granting credits. It uses fake environment values and does not print secrets."
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
  const alipay = await verifyIncompleteAlipayOrderGuard();
  const wechat = await verifyIncompleteWechatOrderGuard();

  console.log(
    JSON.stringify(
      {
        ok: true,
        alipay,
        wechat
      },
      null,
      2
    )
  );
}

async function verifyIncompleteAlipayOrderGuard() {
  clearPaymentEnv();
  process.env.LIGHTQUANT_PAYMENT_MODE = "alipay";
  process.env.PAYMENT_MOCK_ENABLED = "false";
  process.env.PAYMENT_NOTIFY_BASE_URL = "https://pay.example.com";
  process.env.PAYMENT_RETURN_BASE_URL = "https://app.example.com";
  process.env.ALIPAY_APP_ID = "smoke-config-order-alipay-app";
  process.env.ALIPAY_PRIVATE_KEY = "SMOKE_PRIVATE_KEY";
  delete process.env.ALIPAY_PUBLIC_KEY;

  return verifyCreateOrderBlocked({
    label: "alipay-missing-public-key",
    payChannel: "alipay",
    clientRequestId: `smoke-config-order-alipay-${Date.now()}`
  });
}

async function verifyIncompleteWechatOrderGuard() {
  clearPaymentEnv();
  process.env.LIGHTQUANT_PAYMENT_MODE = "wechat";
  process.env.PAYMENT_MOCK_ENABLED = "false";
  process.env.PAYMENT_NOTIFY_BASE_URL = "https://pay.example.com";
  process.env.WECHAT_PAY_APP_ID = "wx-smoke-config-order-app";
  process.env.WECHAT_PAY_MCH_ID = "1900000000";
  process.env.WECHAT_PAY_API_KEY = "too-short";
  process.env.WECHAT_PAY_CERT_SERIAL_NO = "SMOKE_MERCHANT_CERT_SERIAL";
  process.env.WECHAT_PAY_PRIVATE_KEY = "SMOKE_PRIVATE_KEY";
  process.env.WECHAT_PAY_PLATFORM_CERTIFICATE = "SMOKE_PLATFORM_CERT";

  return verifyCreateOrderBlocked({
    label: "wechat-invalid-api-key",
    payChannel: "wechat",
    clientRequestId: `smoke-config-order-wechat-${Date.now()}`
  });
}

async function verifyCreateOrderBlocked(input: {
  label: string;
  payChannel: "alipay" | "wechat";
  clientRequestId: string;
}) {
  const { createRechargeOrder } = await import("@/server/billing/billing-service");
  const { getRepository } = await import("@/server/repositories");
  const repository = getRepository();
  const accountBefore = await repository.ensureCreditAccount(userId, new Date().toISOString());
  let errorCode = "";

  try {
    await createRechargeOrder(userId, {
      planId: "starter",
      payChannel: input.payChannel,
      clientRequestId: input.clientRequestId
    });
  } catch (error) {
    errorCode = readErrorCode(error);
  }

  assertEqual(`${input.label}-error-code`, errorCode, "PAYMENT_CONFIG_ERROR");

  const order = await repository.findRechargeOrderByClientRequestId(userId, input.clientRequestId);
  const accountAfter = await repository.getCreditAccount(userId);
  const ledgerPage = await repository.listCreditLedger(userId, {
    page: 1,
    pageSize: 10
  });

  assertEqual(`${input.label}-order-not-created`, order, null);
  assertEqual(`${input.label}-balance-unchanged`, accountAfter?.balance, accountBefore.balance);
  assertEqual(`${input.label}-ledger-unchanged`, ledgerPage.total, 0);

  return {
    payChannel: input.payChannel,
    errorCode,
    orderCreated: Boolean(order),
    balanceBefore: accountBefore.balance,
    balanceAfter: accountAfter?.balance ?? null,
    ledgerCount: ledgerPage.total
  };
}

function clearPaymentEnv() {
  for (const name of [
    "LIGHTQUANT_PAYMENT_MODE",
    "PAYMENT_MOCK_ENABLED",
    "PAYMENT_NOTIFY_BASE_URL",
    "PAYMENT_RETURN_BASE_URL",
    "ALIPAY_APP_ID",
    "ALIPAY_PRIVATE_KEY",
    "ALIPAY_PUBLIC_KEY",
    "ALIPAY_SELLER_ID",
    "ALIPAY_GATEWAY_URL",
    "WECHAT_PAY_APP_ID",
    "WECHAT_PAY_MCH_ID",
    "WECHAT_PAY_API_KEY",
    "WECHAT_PAY_CERT_SERIAL_NO",
    "WECHAT_PAY_PRIVATE_KEY",
    "WECHAT_PAY_PLATFORM_CERT_SERIAL_NO",
    "WECHAT_PAY_PLATFORM_CERTIFICATE",
    "WECHAT_PAY_GATEWAY_URL"
  ]) {
    delete process.env[name];
  }
}

function readErrorCode(error: unknown) {
  return error && typeof error === "object" && "code" in error ? String(error.code) : "";
}

function assertEqual(step: string, actual: unknown, expected: unknown) {
  if (actual !== expected) {
    throw new Error(`${step} failed: expected=${JSON.stringify(expected)}, actual=${JSON.stringify(actual)}`);
  }
}
