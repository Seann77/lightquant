import { createCipheriv, createSign, generateKeyPairSync, randomBytes, type KeyObject } from "node:crypto";

type LocalKeyPair = {
  privateKey: KeyObject;
  publicKey: KeyObject;
};

const now = new Date().toISOString();
const wechatApiV3Key = "12345678901234567890123456789012";
const wechatPlatformCertSerialNo = "SMOKE_ROUTE_PLATFORM_CERT_SERIAL";

process.env.LIGHTQUANT_DATA_MODE = "mock";

console.log("LightQuant payment notify route smoke test");
console.log(
  JSON.stringify(
    {
      dataMode: process.env.LIGHTQUANT_DATA_MODE,
      note:
        "This smoke calls the local Alipay/WeChat notify route handlers with temporary signed payloads. It does not connect to payment providers or print keys."
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
  const alipaySuccess = await verifyAlipayRouteSuccess();
  const alipayMismatch = await verifyAlipayRouteMismatch();
  const wechatSuccess = await verifyWechatRouteSuccess();
  const wechatMismatch = await verifyWechatRouteMismatch();
  const wechatBadSignatureType = await verifyWechatRouteBadSignatureType();

  console.log(
    JSON.stringify(
      {
        ok: true,
        alipaySuccess,
        alipayMismatch,
        wechatSuccess,
        wechatMismatch,
        wechatBadSignatureType
      },
      null,
      2
    )
  );
}

async function verifyAlipayRouteSuccess() {
  const keyPair = configureAlipayEnv();
  const userId = "smoke-route-alipay-success-user";
  const { POST } = await import("@/app/api/v1/payments/alipay/notify/route");
  const { getRepository } = await import("@/server/repositories");
  const repository = getRepository();
  const accountBefore = await repository.ensureCreditAccount(userId, now);
  const order = await repository.createRechargeOrder(createOrderInput({
    userId,
    orderNoPrefix: "LQROUTEALI",
    payChannel: "alipay",
    amountCents: 990
  }));
  const notifyInput = {
    keyPair,
    orderNo: order.orderNo,
    notifyId: `route-alipay-success-${order.orderNo}`,
    tradeNo: `ALI${order.orderNo}`,
    totalAmount: (order.amountCents / 100).toFixed(2)
  };
  const response = await POST(createAlipayRequest(notifyInput) as never);
  const body = await response.text();

  assertEqual("alipay-route-success-response", body, "success");

  const firstResult = await assertRouteSuccessResult({
    label: "alipay-route-success",
    userId,
    orderId: order.id,
    accountBeforeBalance: accountBefore.balance,
    expectedPoints: order.totalPoints
  });
  const replayResponse = await POST(createAlipayRequest(notifyInput) as never);
  const replayBody = await replayResponse.text();

  assertEqual("alipay-route-success-replay-response", replayBody, "success");

  const replayResult = await assertRouteSuccessResult({
    label: "alipay-route-success-replay",
    userId,
    orderId: order.id,
    accountBeforeBalance: accountBefore.balance,
    expectedPoints: order.totalPoints
  });

  assertEqual("alipay-route-success-transaction-id-stable", replayResult.transactionId, firstResult.transactionId);

  const duplicateResponse = await POST(createAlipayRequest({
    ...notifyInput,
    notifyId: `route-alipay-success-duplicate-${order.orderNo}`
  }) as never);
  const duplicateBody = await duplicateResponse.text();

  assertEqual("alipay-route-success-duplicate-response", duplicateBody, "success");

  const duplicateResult = await assertRoutePaidDuplicateResult({
    label: "alipay-route-success-duplicate",
    userId,
    orderId: order.id,
    accountBeforeBalance: accountBefore.balance,
    expectedPoints: order.totalPoints
  });

  return {
    ...duplicateResult,
    replayResponse: "success",
    duplicateResponse: "success",
    originalTransactionId: firstResult.transactionId
  };
}

async function verifyAlipayRouteMismatch() {
  const keyPair = configureAlipayEnv();
  const userId = "smoke-route-alipay-mismatch-user";
  const { POST } = await import("@/app/api/v1/payments/alipay/notify/route");
  const { getRepository } = await import("@/server/repositories");
  const repository = getRepository();
  const accountBefore = await repository.ensureCreditAccount(userId, now);
  const order = await repository.createRechargeOrder(createOrderInput({
    userId,
    orderNoPrefix: "LQROUTEALIMIS",
    payChannel: "alipay",
    amountCents: 990
  }));
  const notifyInput = {
    keyPair,
    orderNo: order.orderNo,
    notifyId: `route-alipay-mismatch-${order.orderNo}`,
    tradeNo: `ALI${order.orderNo}`,
    totalAmount: ((order.amountCents + 1) / 100).toFixed(2)
  };
  const response = await POST(createAlipayRequest(notifyInput) as never);
  const body = await response.text();

  assertEqual("alipay-route-mismatch-response", body, "failure");

  const firstResult = await assertRouteMismatchResult({
    label: "alipay-route-mismatch",
    userId,
    orderId: order.id,
    accountBeforeBalance: accountBefore.balance
  });
  const replayResponse = await POST(createAlipayRequest(notifyInput) as never);
  const replayBody = await replayResponse.text();

  assertEqual("alipay-route-mismatch-replay-response", replayBody, "failure");

  const replayResult = await assertRouteMismatchResult({
    label: "alipay-route-mismatch-replay",
    userId,
    orderId: order.id,
    accountBeforeBalance: accountBefore.balance
  });

  assertEqual("alipay-route-mismatch-transaction-id-stable", replayResult.transactionId, firstResult.transactionId);

  return {
    ...replayResult,
    replayResponse: "failure"
  };
}

async function verifyWechatRouteSuccess() {
  const keyPair = configureWechatEnv();
  const userId = "smoke-route-wechat-success-user";
  const { POST } = await import("@/app/api/v1/payments/wechat/notify/route");
  const { getRepository } = await import("@/server/repositories");
  const repository = getRepository();
  const accountBefore = await repository.ensureCreditAccount(userId, now);
  const order = await repository.createRechargeOrder(createOrderInput({
    userId,
    orderNoPrefix: "LQROUTEWX",
    payChannel: "wechat",
    amountCents: 990
  }));
  const notifyInput = {
    keyPair,
    orderNo: order.orderNo,
    transactionId: `WX${order.orderNo}`,
    amountCents: order.amountCents
  };
  const response = await POST(createWechatRequest(notifyInput) as never);
  const body = await response.json();

  assertEqual("wechat-route-success-response", isRecord(body) ? body.code : null, "SUCCESS");

  const firstResult = await assertRouteSuccessResult({
    label: "wechat-route-success",
    userId,
    orderId: order.id,
    accountBeforeBalance: accountBefore.balance,
    expectedPoints: order.totalPoints
  });
  const replayResponse = await POST(createWechatRequest(notifyInput) as never);
  const replayBody = await replayResponse.json();

  assertEqual("wechat-route-success-replay-response", isRecord(replayBody) ? replayBody.code : null, "SUCCESS");

  const replayResult = await assertRouteSuccessResult({
    label: "wechat-route-success-replay",
    userId,
    orderId: order.id,
    accountBeforeBalance: accountBefore.balance,
    expectedPoints: order.totalPoints
  });

  assertEqual("wechat-route-success-transaction-id-stable", replayResult.transactionId, firstResult.transactionId);

  const duplicateResponse = await POST(createWechatRequest({
    ...notifyInput,
    transactionId: `WX${order.orderNo}DUP`
  }) as never);
  const duplicateBody = await duplicateResponse.json();

  assertEqual("wechat-route-success-duplicate-response", isRecord(duplicateBody) ? duplicateBody.code : null, "SUCCESS");

  const duplicateResult = await assertRoutePaidDuplicateResult({
    label: "wechat-route-success-duplicate",
    userId,
    orderId: order.id,
    accountBeforeBalance: accountBefore.balance,
    expectedPoints: order.totalPoints
  });

  return {
    ...duplicateResult,
    replayResponse: "SUCCESS",
    duplicateResponse: "SUCCESS",
    originalTransactionId: firstResult.transactionId
  };
}

async function verifyWechatRouteMismatch() {
  const keyPair = configureWechatEnv();
  const userId = "smoke-route-wechat-mismatch-user";
  const { POST } = await import("@/app/api/v1/payments/wechat/notify/route");
  const { getRepository } = await import("@/server/repositories");
  const repository = getRepository();
  const accountBefore = await repository.ensureCreditAccount(userId, now);
  const order = await repository.createRechargeOrder(createOrderInput({
    userId,
    orderNoPrefix: "LQROUTEWXMIS",
    payChannel: "wechat",
    amountCents: 990
  }));
  const notifyInput = {
    keyPair,
    orderNo: order.orderNo,
    transactionId: `WX${order.orderNo}`,
    amountCents: order.amountCents + 1
  };
  const response = await POST(createWechatRequest(notifyInput) as never);
  const body = await response.json();

  assertEqual("wechat-route-mismatch-response", isRecord(body) ? body.code : null, "FAIL");

  const firstResult = await assertRouteMismatchResult({
    label: "wechat-route-mismatch",
    userId,
    orderId: order.id,
    accountBeforeBalance: accountBefore.balance
  });
  const replayResponse = await POST(createWechatRequest(notifyInput) as never);
  const replayBody = await replayResponse.json();

  assertEqual("wechat-route-mismatch-replay-response", isRecord(replayBody) ? replayBody.code : null, "FAIL");

  const replayResult = await assertRouteMismatchResult({
    label: "wechat-route-mismatch-replay",
    userId,
    orderId: order.id,
    accountBeforeBalance: accountBefore.balance
  });

  assertEqual("wechat-route-mismatch-transaction-id-stable", replayResult.transactionId, firstResult.transactionId);

  return {
    ...replayResult,
    replayResponse: "FAIL"
  };
}

async function verifyWechatRouteBadSignatureType() {
  const keyPair = configureWechatEnv();
  const userId = "smoke-route-wechat-bad-signature-type-user";
  const { POST } = await import("@/app/api/v1/payments/wechat/notify/route");
  const { getRepository } = await import("@/server/repositories");
  const repository = getRepository();
  const accountBefore = await repository.ensureCreditAccount(userId, now);
  const order = await repository.createRechargeOrder(createOrderInput({
    userId,
    orderNoPrefix: "LQROUTEWXSIG",
    payChannel: "wechat",
    amountCents: 990
  }));
  const response = await POST(createWechatRequest({
    keyPair,
    orderNo: order.orderNo,
    transactionId: `WX${order.orderNo}`,
    amountCents: order.amountCents,
    signatureType: "UNSUPPORTED-SIGNATURE-TYPE"
  }) as never);
  const body = await response.json();

  assertEqual("wechat-route-bad-signature-type-response", isRecord(body) ? body.code : null, "FAIL");

  const storedOrder = await repository.findOrderById(order.id);
  const transaction = await repository.findLatestPaymentTransactionByOrderId(order.id);
  const accountAfter = await repository.getCreditAccount(userId);
  const ledgerPage = await repository.listCreditLedger(userId, {
    page: 1,
    pageSize: 10
  });

  assertEqual("wechat-route-bad-signature-type-order-status", storedOrder?.status, "PENDING");
  assertEqual("wechat-route-bad-signature-type-no-transaction", transaction, null);
  assertEqual("wechat-route-bad-signature-type-balance", accountAfter?.balance, accountBefore.balance);
  assertEqual("wechat-route-bad-signature-type-ledger-count", ledgerPage.total, 0);

  return {
    response: "FAIL",
    orderStatus: storedOrder?.status,
    transactionCreated: Boolean(transaction),
    balanceAfter: accountAfter?.balance,
    ledgerCount: ledgerPage.total
  };
}

function configureAlipayEnv(): LocalKeyPair {
  const keyPair = generateKeyPairSync("rsa", {
    modulusLength: 2048
  });

  process.env.LIGHTQUANT_PAYMENT_MODE = "alipay";
  process.env.PAYMENT_MOCK_ENABLED = "false";
  process.env.PAYMENT_NOTIFY_BASE_URL = "https://pay.example.com";
  process.env.PAYMENT_RETURN_BASE_URL = "https://app.example.com";
  process.env.ALIPAY_APP_ID = "smoke-route-alipay-app";
  process.env.ALIPAY_GATEWAY_URL = "https://openapi.alipay.com/gateway.do";
  process.env.ALIPAY_PRIVATE_KEY = keyPair.privateKey.export({
    type: "pkcs8",
    format: "pem"
  }).toString();
  process.env.ALIPAY_PUBLIC_KEY = keyPair.publicKey.export({
    type: "spki",
    format: "pem"
  }).toString();

  return keyPair;
}

function configureWechatEnv(): LocalKeyPair {
  const merchantKeyPair = generateKeyPairSync("rsa", {
    modulusLength: 2048
  });
  const platformKeyPair = generateKeyPairSync("rsa", {
    modulusLength: 2048
  });

  process.env.LIGHTQUANT_PAYMENT_MODE = "wechat";
  process.env.PAYMENT_MOCK_ENABLED = "false";
  process.env.PAYMENT_NOTIFY_BASE_URL = "https://pay.example.com";
  process.env.WECHAT_PAY_APP_ID = "wx-smoke-route-app";
  process.env.WECHAT_PAY_MCH_ID = "1900000000";
  process.env.WECHAT_PAY_API_KEY = wechatApiV3Key;
  process.env.WECHAT_PAY_CERT_SERIAL_NO = "SMOKE_ROUTE_MERCHANT_CERT_SERIAL";
  process.env.WECHAT_PAY_PLATFORM_CERT_SERIAL_NO = wechatPlatformCertSerialNo;
  process.env.WECHAT_PAY_PRIVATE_KEY = merchantKeyPair.privateKey.export({
    type: "pkcs8",
    format: "pem"
  }).toString();
  process.env.WECHAT_PAY_PLATFORM_CERTIFICATE = platformKeyPair.publicKey.export({
    type: "spki",
    format: "pem"
  }).toString();

  return platformKeyPair;
}

function createOrderInput(input: {
  userId: string;
  orderNoPrefix: string;
  payChannel: "alipay" | "wechat";
  amountCents: number;
}) {
  return {
    orderNo: `${input.orderNoPrefix}${Date.now()}${Math.random().toString(16).slice(2, 8)}`,
    userId: input.userId,
    planId: "starter",
    amountCents: input.amountCents,
    points: 1000,
    bonusPoints: 0,
    totalPoints: 1000,
    payChannel: input.payChannel,
    status: "PENDING" as const,
    clientRequestId: `smoke-route-${input.payChannel}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    paidAt: null,
    closedAt: null,
    createdAt: now,
    updatedAt: now
  };
}

function createAlipayRequest(input: {
  keyPair: LocalKeyPair;
  orderNo: string;
  notifyId: string;
  tradeNo: string;
  totalAmount: string;
}) {
  const payload = {
    app_id: process.env.ALIPAY_APP_ID ?? "",
    notify_id: input.notifyId,
    out_trade_no: input.orderNo,
    trade_no: input.tradeNo,
    trade_status: "TRADE_SUCCESS",
    total_amount: input.totalAmount,
    sign_type: "RSA2"
  };
  const signText = buildAlipaySignText(payload);
  const sign = createSign("RSA-SHA256").update(signText, "utf8").sign(input.keyPair.privateKey, "base64");
  const form = new FormData();

  for (const [key, value] of Object.entries({
    ...payload,
    sign
  })) {
    form.append(key, value);
  }

  return new Request("http://127.0.0.1:3010/api/v1/payments/alipay/notify", {
    method: "POST",
    body: form
  });
}

function createWechatRequest(input: {
  keyPair: LocalKeyPair;
  orderNo: string;
  transactionId: string;
  amountCents: number;
  signatureType?: string;
}) {
  const resource = encryptWechatResource(JSON.stringify({
    appid: process.env.WECHAT_PAY_APP_ID ?? "",
    mchid: process.env.WECHAT_PAY_MCH_ID ?? "",
    out_trade_no: input.orderNo,
    transaction_id: input.transactionId,
    trade_state: "SUCCESS",
    amount: {
      total: input.amountCents,
      currency: "CNY"
    }
  }));
  const rawBody = JSON.stringify({
    id: `wechat-route-${input.transactionId}`,
    create_time: new Date().toISOString().replace(/\.\d{3}Z$/, "+00:00"),
    event_type: "TRANSACTION.SUCCESS",
    resource_type: "encrypt-resource",
    resource
  });
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = randomBytes(16).toString("hex");
  const signText = `${timestamp}\n${nonce}\n${rawBody}\n`;
  const signature = createSign("RSA-SHA256").update(signText, "utf8").sign(input.keyPair.privateKey, "base64");

  return new Request("http://127.0.0.1:3010/api/v1/payments/wechat/notify", {
    method: "POST",
    body: rawBody,
    headers: {
      "content-type": "application/json",
      "wechatpay-timestamp": timestamp,
      "wechatpay-nonce": nonce,
      "wechatpay-signature": signature,
      "wechatpay-signature-type": input.signatureType ?? "WECHATPAY2-SHA256-RSA2048",
      "wechatpay-serial": wechatPlatformCertSerialNo
    }
  });
}

async function assertRouteSuccessResult(input: {
  label: string;
  userId: string;
  orderId: string;
  accountBeforeBalance: number;
  expectedPoints: number;
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

  assertEqual(`${input.label}-order-status`, storedOrder?.status, "PAID");
  assertEqual(`${input.label}-transaction-status`, transaction.status, "VERIFIED");
  assertEqual(`${input.label}-order-before`, transaction.orderStatusBefore, "PENDING");
  assertEqual(`${input.label}-order-after`, transaction.orderStatusAfter, "PAID");
  assertEqual(`${input.label}-balance`, accountAfter?.balance, input.accountBeforeBalance + input.expectedPoints);
  assertEqual(`${input.label}-ledger-count`, ledgerPage.total, 1);
  assertEqual(`${input.label}-ledger-scene`, ledgerPage.items[0]?.scene, "recharge");

  return {
    transactionId: transaction.id,
    response: "success",
    orderStatus: storedOrder?.status,
    transactionStatus: transaction.status,
    balanceAfter: accountAfter?.balance,
    ledgerCount: ledgerPage.total
  };
}

async function assertRouteMismatchResult(input: {
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
  assertEqual(`${input.label}-balance`, accountAfter?.balance, input.accountBeforeBalance);
  assertEqual(`${input.label}-ledger-count`, ledgerPage.total, 0);

  return {
    transactionId: transaction.id,
    response: "failure",
    orderStatus: storedOrder?.status,
    transactionStatus: transaction.status,
    failedReason: transaction.failedReason,
    balanceAfter: accountAfter?.balance,
    ledgerCount: ledgerPage.total
  };
}

async function assertRoutePaidDuplicateResult(input: {
  label: string;
  userId: string;
  orderId: string;
  accountBeforeBalance: number;
  expectedPoints: number;
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

  assertEqual(`${input.label}-order-status`, storedOrder?.status, "PAID");
  assertEqual(`${input.label}-transaction-status`, transaction.status, "DUPLICATE");
  assertEqual(`${input.label}-failed-reason`, transaction.failedReason, "ORDER_ALREADY_PAID");
  assertEqual(`${input.label}-order-before`, transaction.orderStatusBefore, "PAID");
  assertEqual(`${input.label}-order-after`, transaction.orderStatusAfter, "PAID");
  assertEqual(`${input.label}-balance`, accountAfter?.balance, input.accountBeforeBalance + input.expectedPoints);
  assertEqual(`${input.label}-ledger-count`, ledgerPage.total, 1);
  assertEqual(`${input.label}-ledger-scene`, ledgerPage.items[0]?.scene, "recharge");

  return {
    transactionId: transaction.id,
    response: "success",
    orderStatus: storedOrder?.status,
    transactionStatus: transaction.status,
    failedReason: transaction.failedReason,
    balanceAfter: accountAfter?.balance,
    ledgerCount: ledgerPage.total
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function assertEqual(step: string, actual: unknown, expected: unknown) {
  if (actual !== expected) {
    throw new Error(`${step} failed: expected=${JSON.stringify(expected)}, actual=${JSON.stringify(actual)}`);
  }
}
