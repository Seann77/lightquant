import { createCipheriv, createSign, generateKeyPairSync, randomBytes, type KeyObject } from "node:crypto";

const now = new Date().toISOString();
const wechatApiV3Key = "12345678901234567890123456789012";
const wechatPlatformCertSerialNo = "SMOKE_PLATFORM_CERT_SERIAL";

console.log("LightQuant verified payment notify guard smoke test");
console.log(
  JSON.stringify(
    {
      dataMode: "mock",
      note:
        "This smoke uses local temporary keys to verify signed Alipay/WeChat notifies with mismatched amounts do not change orders or grant credits. It does not connect to payment providers or print keys."
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
  process.env.LIGHTQUANT_DATA_MODE = "mock";

  const alipay = await verifyAlipayAmountMismatch();
  const wechat = await verifyWechatAmountMismatch();

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

async function verifyAlipayAmountMismatch() {
  const keyPair = generateKeyPairSync("rsa", {
    modulusLength: 2048
  });
  const userId = "smoke-alipay-amount-mismatch-user";

  process.env.LIGHTQUANT_PAYMENT_MODE = "alipay";
  process.env.PAYMENT_MOCK_ENABLED = "false";
  process.env.PAYMENT_NOTIFY_BASE_URL = "https://pay.example.com";
  process.env.PAYMENT_RETURN_BASE_URL = "https://app.example.com";
  process.env.ALIPAY_APP_ID = "smoke-alipay-app";
  process.env.ALIPAY_GATEWAY_URL = "https://openapi.alipay.com/gateway.do";
  process.env.ALIPAY_PRIVATE_KEY = keyPair.privateKey.export({
    type: "pkcs8",
    format: "pem"
  }).toString();
  process.env.ALIPAY_PUBLIC_KEY = keyPair.publicKey.export({
    type: "spki",
    format: "pem"
  }).toString();

  const { handleVerifiedPaymentNotify } = await import("@/server/billing/billing-service");
  const { parseAndVerifyAlipayNotify } = await import("@/server/payments/providers/alipay-provider");
  const { getRepository } = await import("@/server/repositories");
  const repository = getRepository();
  const accountBefore = await repository.ensureCreditAccount(userId, now);
  const order = await repository.createRechargeOrder({
    orderNo: `LQALIMISMATCH${Date.now()}`,
    userId,
    planId: "starter",
    amountCents: 990,
    points: 1000,
    bonusPoints: 0,
    totalPoints: 1000,
    payChannel: "alipay",
    status: "PENDING",
    clientRequestId: `smoke-alipay-amount-mismatch-${Date.now()}`,
    paidAt: null,
    closedAt: null,
    createdAt: now,
    updatedAt: now
  });
  const signedForm = createSignedAlipayNotifyForm(
    {
      app_id: process.env.ALIPAY_APP_ID ?? "",
      notify_id: `alipay-mismatch-${order.orderNo}`,
      out_trade_no: order.orderNo,
      trade_no: `ALI${order.orderNo}`,
      trade_status: "TRADE_SUCCESS",
      total_amount: ((order.amountCents + 1) / 100).toFixed(2),
      sign_type: "RSA2"
    },
    process.env.ALIPAY_PRIVATE_KEY ?? ""
  );
  const notify = parseAndVerifyAlipayNotify(signedForm);
  let errorCode = "";

  try {
    await handleVerifiedPaymentNotify(
      {
        provider: "alipay",
        orderNo: notify.outTradeNo,
        providerTradeNo: notify.tradeNo,
        notifyId: notify.notifyId,
        amountCents: notify.totalAmountCents,
        rawPayload: notify.rawPayload
      },
      "smoke-alipay-amount-mismatch-request"
    );
  } catch (error) {
    errorCode = readErrorCode(error);
  }

  assertEqual("alipay-mismatch-error-code", errorCode, "PAYMENT_AMOUNT_MISMATCH");

  const firstGuard = await assertAmountMismatchResult({
    label: "alipay-mismatch",
    userId,
    orderId: order.id,
    accountBeforeBalance: accountBefore.balance
  });
  let repeatedErrorCode = "";

  try {
    await handleVerifiedPaymentNotify(
      {
        provider: "alipay",
        orderNo: notify.outTradeNo,
        providerTradeNo: notify.tradeNo,
        notifyId: notify.notifyId,
        amountCents: notify.totalAmountCents,
        rawPayload: notify.rawPayload
      },
      "smoke-alipay-amount-mismatch-request-replay"
    );
  } catch (error) {
    repeatedErrorCode = readErrorCode(error);
  }

  assertEqual("alipay-mismatch-repeated-error-code", repeatedErrorCode, "PAYMENT_AMOUNT_MISMATCH");

  const secondGuard = await assertAmountMismatchResult({
    label: "alipay-mismatch-replay",
    userId,
    orderId: order.id,
    accountBeforeBalance: accountBefore.balance
  });

  assertEqual("alipay-mismatch-transaction-id-stable", secondGuard.transactionId, firstGuard.transactionId);

  return {
    ...secondGuard,
    repeatedErrorCode
  };
}

async function verifyWechatAmountMismatch() {
  const merchantKeyPair = generateKeyPairSync("rsa", {
    modulusLength: 2048
  });
  const platformKeyPair = generateKeyPairSync("rsa", {
    modulusLength: 2048
  });
  const userId = "smoke-wechat-amount-mismatch-user";

  process.env.LIGHTQUANT_PAYMENT_MODE = "wechat";
  process.env.PAYMENT_MOCK_ENABLED = "false";
  process.env.PAYMENT_NOTIFY_BASE_URL = "https://pay.example.com";
  process.env.WECHAT_PAY_APP_ID = "wx-smoke-app";
  process.env.WECHAT_PAY_MCH_ID = "1900000000";
  process.env.WECHAT_PAY_API_KEY = wechatApiV3Key;
  process.env.WECHAT_PAY_CERT_SERIAL_NO = "SMOKE_MERCHANT_CERT_SERIAL";
  process.env.WECHAT_PAY_PLATFORM_CERT_SERIAL_NO = wechatPlatformCertSerialNo;
  process.env.WECHAT_PAY_PRIVATE_KEY = merchantKeyPair.privateKey.export({
    type: "pkcs8",
    format: "pem"
  }).toString();
  process.env.WECHAT_PAY_PLATFORM_CERTIFICATE = platformKeyPair.publicKey.export({
    type: "spki",
    format: "pem"
  }).toString();

  const { handleVerifiedPaymentNotify } = await import("@/server/billing/billing-service");
  const { parseAndVerifyWechatNotify } = await import("@/server/payments/providers/wechat-provider");
  const { getRepository } = await import("@/server/repositories");
  const repository = getRepository();
  const accountBefore = await repository.ensureCreditAccount(userId, now);
  const order = await repository.createRechargeOrder({
    orderNo: `LQWXMISMATCH${Date.now()}`,
    userId,
    planId: "starter",
    amountCents: 990,
    points: 1000,
    bonusPoints: 0,
    totalPoints: 1000,
    payChannel: "wechat",
    status: "PENDING",
    clientRequestId: `smoke-wechat-amount-mismatch-${Date.now()}`,
    paidAt: null,
    closedAt: null,
    createdAt: now,
    updatedAt: now
  });
  const signedNotify = createSignedWechatNotify(
    {
      appid: process.env.WECHAT_PAY_APP_ID ?? "",
      mchid: process.env.WECHAT_PAY_MCH_ID ?? "",
      out_trade_no: order.orderNo,
      transaction_id: `WX${order.orderNo}`,
      trade_state: "SUCCESS",
      amount: {
        total: order.amountCents + 1,
        currency: "CNY"
      }
    },
    platformKeyPair.privateKey
  );
  const notify = parseAndVerifyWechatNotify(signedNotify.headers, signedNotify.rawBody);
  let errorCode = "";

  try {
    await handleVerifiedPaymentNotify(
      {
        provider: "wechat",
        orderNo: notify.outTradeNo,
        providerTradeNo: notify.transactionId,
        notifyId: notify.transactionId,
        amountCents: notify.amountCents,
        rawPayload: notify.rawPayload
      },
      "smoke-wechat-amount-mismatch-request"
    );
  } catch (error) {
    errorCode = readErrorCode(error);
  }

  assertEqual("wechat-mismatch-error-code", errorCode, "PAYMENT_AMOUNT_MISMATCH");

  const firstGuard = await assertAmountMismatchResult({
    label: "wechat-mismatch",
    userId,
    orderId: order.id,
    accountBeforeBalance: accountBefore.balance
  });
  let repeatedErrorCode = "";

  try {
    await handleVerifiedPaymentNotify(
      {
        provider: "wechat",
        orderNo: notify.outTradeNo,
        providerTradeNo: notify.transactionId,
        notifyId: notify.transactionId,
        amountCents: notify.amountCents,
        rawPayload: notify.rawPayload
      },
      "smoke-wechat-amount-mismatch-request-replay"
    );
  } catch (error) {
    repeatedErrorCode = readErrorCode(error);
  }

  assertEqual("wechat-mismatch-repeated-error-code", repeatedErrorCode, "PAYMENT_AMOUNT_MISMATCH");

  const secondGuard = await assertAmountMismatchResult({
    label: "wechat-mismatch-replay",
    userId,
    orderId: order.id,
    accountBeforeBalance: accountBefore.balance
  });

  assertEqual("wechat-mismatch-transaction-id-stable", secondGuard.transactionId, firstGuard.transactionId);

  return {
    ...secondGuard,
    repeatedErrorCode
  };
}

async function assertAmountMismatchResult(input: {
  label: string;
  userId: string;
  orderId: string;
  accountBeforeBalance: number;
}) {
  const { getRepository } = await import("@/server/repositories");
  const repository = getRepository();
  const storedOrder = await repository.findOrderById(input.orderId);
  const transaction = await repository.findLatestPaymentTransactionByOrderId(input.orderId);
  const accountAfter = await repository.getCreditAccount(input.userId);
  const ledgerPage = await repository.listCreditLedger(input.userId, {
    page: 1,
    pageSize: 10
  });

  if (!transaction) {
    throw new Error(`${input.label}-transaction missing`);
  }

  assertEqual(`${input.label}-order-status`, storedOrder?.status, "PENDING");
  assertEqual(`${input.label}-transaction-status`, transaction.status, "FAILED");
  assertEqual(`${input.label}-failed-reason`, transaction.failedReason, "PAYMENT_AMOUNT_MISMATCH");
  assertEqual(`${input.label}-order-before`, transaction.orderStatusBefore, "PENDING");
  assertEqual(`${input.label}-order-after`, transaction.orderStatusAfter, "PENDING");
  assertEqual(`${input.label}-balance-unchanged`, accountAfter?.balance, input.accountBeforeBalance);
  assertEqual(`${input.label}-ledger-count`, ledgerPage.total, 0);

  return {
    transactionId: transaction.id,
    orderStatus: storedOrder?.status,
    transactionStatus: transaction.status,
    failedReason: transaction.failedReason,
    balanceBefore: input.accountBeforeBalance,
    balanceAfter: accountAfter?.balance,
    ledgerCount: ledgerPage.total
  };
}

function createSignedAlipayNotifyForm(payload: Record<string, string>, privateKey: string) {
  const signText = buildAlipaySignText(payload);
  const sign = createSign("RSA-SHA256").update(signText, "utf8").sign(privateKey, "base64");
  const form = new FormData();

  for (const [key, value] of Object.entries({
    ...payload,
    sign
  })) {
    form.append(key, value);
  }

  return form;
}

function createSignedWechatNotify(transaction: Record<string, unknown>, platformPrivateKey: KeyObject) {
  const resource = encryptWechatResource(JSON.stringify(transaction));
  const rawBody = JSON.stringify({
    id: `wechat-mismatch-${transaction.out_trade_no}`,
    create_time: new Date().toISOString().replace(/\.\d{3}Z$/, "+00:00"),
    event_type: "TRANSACTION.SUCCESS",
    resource_type: "encrypt-resource",
    resource
  });
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = randomBytes(16).toString("hex");
  const signText = `${timestamp}\n${nonce}\n${rawBody}\n`;
  const signature = createSign("RSA-SHA256").update(signText, "utf8").sign(platformPrivateKey, "base64");

  return {
    rawBody,
    headers: new Headers({
      "wechatpay-timestamp": timestamp,
      "wechatpay-nonce": nonce,
      "wechatpay-signature": signature,
      "wechatpay-signature-type": "WECHATPAY2-SHA256-RSA2048",
      "wechatpay-serial": wechatPlatformCertSerialNo
    })
  };
}

function encryptWechatResource(plainText: string) {
  const nonce = randomBytes(6).toString("hex");
  const associatedData = "transaction";
  const cipher = createCipheriv("aes-256-gcm", Buffer.from(wechatApiV3Key, "utf8"), Buffer.from(nonce, "utf8"));

  cipher.setAAD(Buffer.from(associatedData, "utf8"));

  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    algorithm: "AEAD_AES_256_GCM",
    ciphertext: Buffer.concat([encrypted, authTag]).toString("base64"),
    associated_data: associatedData,
    nonce
  };
}

function buildAlipaySignText(params: Record<string, string>) {
  return Object.keys(params)
    .filter((key) => key !== "sign" && params[key] !== "")
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
}

function readErrorCode(error: unknown) {
  return error && typeof error === "object" && "code" in error ? String(error.code) : "";
}

function assertEqual(step: string, actual: unknown, expected: unknown) {
  if (actual !== expected) {
    throw new Error(`${step} failed: expected=${JSON.stringify(expected)}, actual=${JSON.stringify(actual)}`);
  }
}
