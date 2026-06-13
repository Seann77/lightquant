import { createSign, generateKeyPairSync } from "node:crypto";

const userId = "smoke-alipay-notify-user";
const now = new Date().toISOString();

process.env.LIGHTQUANT_DATA_MODE = "mock";
process.env.LIGHTQUANT_PAYMENT_MODE = "alipay";
process.env.PAYMENT_MOCK_ENABLED = "false";
process.env.PAYMENT_NOTIFY_BASE_URL = "https://pay.example.com";
process.env.PAYMENT_RETURN_BASE_URL = "https://app.example.com";
process.env.ALIPAY_APP_ID = "smoke-alipay-app";
process.env.ALIPAY_GATEWAY_URL = "https://openapi.alipay.com/gateway.do";

const keyPair = generateKeyPairSync("rsa", {
  modulusLength: 2048
});

process.env.ALIPAY_PRIVATE_KEY = keyPair.privateKey.export({
  type: "pkcs8",
  format: "pem"
}).toString();
process.env.ALIPAY_PUBLIC_KEY = keyPair.publicKey.export({
  type: "spki",
  format: "pem"
}).toString();

console.log("LightQuant signed Alipay notify smoke test");
console.log(
  JSON.stringify(
    {
      dataMode: process.env.LIGHTQUANT_DATA_MODE,
      paymentMode: process.env.LIGHTQUANT_PAYMENT_MODE,
      note:
        "This smoke uses local temporary RSA keys to verify Alipay notify parsing, signature verification, order crediting, and idempotency. It does not connect to Alipay or print keys."
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
  const { handleVerifiedPaymentNotify } = await import("@/server/billing/billing-service");
  const { parseAndVerifyAlipayNotify } = await import("@/server/payments/providers/alipay-provider");
  const { getRepository } = await import("@/server/repositories");
  const repository = getRepository();
  const accountBefore = await repository.ensureCreditAccount(userId, now);
  const order = await repository.createRechargeOrder({
    orderNo: `LQALINOTIFY${Date.now()}`,
    userId,
    planId: "starter",
    amountCents: 990,
    points: 1000,
    bonusPoints: 0,
    totalPoints: 1000,
    payChannel: "alipay",
    status: "PENDING",
    clientRequestId: `smoke-alipay-notify-${Date.now()}`,
    paidAt: null,
    closedAt: null,
    createdAt: now,
    updatedAt: now
  });
  const signedForm = createSignedAlipayNotifyForm({
    app_id: process.env.ALIPAY_APP_ID ?? "",
    notify_id: `alipay-notify-${order.orderNo}`,
    out_trade_no: order.orderNo,
    trade_no: `ALI${order.orderNo}`,
    trade_status: "TRADE_SUCCESS",
    total_amount: (order.amountCents / 100).toFixed(2),
    sign_type: "RSA2"
  });
  const notify = parseAndVerifyAlipayNotify(signedForm);

  const firstResult = await handleVerifiedPaymentNotify(
    {
      provider: "alipay",
      orderNo: notify.outTradeNo,
      providerTradeNo: notify.tradeNo,
      notifyId: notify.notifyId,
      amountCents: notify.totalAmountCents,
      rawPayload: notify.rawPayload
    },
    "smoke-alipay-notify-request-1"
  );

  assertEqual("alipay-notify-first-order-status", firstResult.order.status, "PAID");
  assertEqual("alipay-notify-first-credit-granted", firstResult.credit.granted, true);
  assertEqual("alipay-notify-first-credit-duplicated", firstResult.credit.duplicated, false);

  const accountAfterFirst = await repository.getCreditAccount(userId);
  assertEqual("alipay-notify-balance-after-first", accountAfterFirst?.balance, accountBefore.balance + order.totalPoints);

  const ledgerPageAfterFirst = await repository.listCreditLedger(userId, {
    page: 1,
    pageSize: 10
  });
  assertEqual("alipay-notify-ledger-count-after-first", ledgerPageAfterFirst.total, 1);
  assertEqual("alipay-notify-ledger-scene", ledgerPageAfterFirst.items[0]?.scene, "recharge");
  assertEqual("alipay-notify-ledger-idempotency", ledgerPageAfterFirst.items[0]?.idempotencyKey, `recharge:${order.id}`);

  const secondResult = await handleVerifiedPaymentNotify(
    {
      provider: "alipay",
      orderNo: notify.outTradeNo,
      providerTradeNo: notify.tradeNo,
      notifyId: notify.notifyId,
      amountCents: notify.totalAmountCents,
      rawPayload: notify.rawPayload
    },
    "smoke-alipay-notify-request-2"
  );

  assertEqual("alipay-notify-second-duplicated", secondResult.payment.duplicated, true);
  assertEqual("alipay-notify-second-credit-duplicated", secondResult.credit.duplicated, true);

  const accountAfterSecond = await repository.getCreditAccount(userId);
  const ledgerPageAfterSecond = await repository.listCreditLedger(userId, {
    page: 1,
    pageSize: 10
  });

  assertEqual("alipay-notify-balance-after-second", accountAfterSecond?.balance, accountAfterFirst?.balance);
  assertEqual("alipay-notify-ledger-count-after-second", ledgerPageAfterSecond.total, ledgerPageAfterFirst.total);

  const transaction = await repository.findLatestPaymentTransactionByOrderId(order.id);

  if (!transaction) {
    throw new Error("alipay-notify-transaction missing");
  }

  assertEqual("alipay-notify-transaction-status", transaction.status, "VERIFIED");
  assertEqual("alipay-notify-transaction-provider", transaction.provider, "alipay");
  assertEqual("alipay-notify-transaction-before", transaction.orderStatusBefore, "PENDING");
  assertEqual("alipay-notify-transaction-after", transaction.orderStatusAfter, "PAID");

  console.log(
    JSON.stringify(
      {
        ok: true,
        order: {
          id: order.id,
          status: firstResult.order.status,
          payChannel: firstResult.order.payChannel
        },
        credit: {
          balanceBefore: accountBefore.balance,
          balanceAfterFirst: accountAfterFirst?.balance,
          balanceAfterSecond: accountAfterSecond?.balance,
          ledgerCount: ledgerPageAfterSecond.total
        },
        transaction: {
          status: transaction.status,
          provider: transaction.provider,
          orderStatusBefore: transaction.orderStatusBefore,
          orderStatusAfter: transaction.orderStatusAfter
        }
      },
      null,
      2
    )
  );
}

function createSignedAlipayNotifyForm(payload: Record<string, string>) {
  const signText = buildAlipaySignText(payload);
  const sign = createSign("RSA-SHA256").update(signText, "utf8").sign(process.env.ALIPAY_PRIVATE_KEY ?? "", "base64");
  const form = new FormData();

  for (const [key, value] of Object.entries({
    ...payload,
    sign
  })) {
    form.append(key, value);
  }

  return form;
}

function buildAlipaySignText(params: Record<string, string>) {
  return Object.keys(params)
    .filter((key) => key !== "sign" && params[key] !== "")
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
}

function assertEqual(step: string, actual: unknown, expected: unknown) {
  if (actual !== expected) {
    throw new Error(`${step} failed: expected=${JSON.stringify(expected)}, actual=${JSON.stringify(actual)}`);
  }
}
