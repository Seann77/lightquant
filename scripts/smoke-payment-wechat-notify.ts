import { createCipheriv, createSign, generateKeyPairSync, randomBytes } from "node:crypto";

const userId = "smoke-wechat-notify-user";
const now = new Date().toISOString();
const apiV3Key = "12345678901234567890123456789012";
const platformCertSerialNo = "SMOKE_PLATFORM_CERT_SERIAL";

process.env.LIGHTQUANT_DATA_MODE = "mock";
process.env.LIGHTQUANT_PAYMENT_MODE = "wechat";
process.env.PAYMENT_MOCK_ENABLED = "false";
process.env.PAYMENT_NOTIFY_BASE_URL = "https://pay.example.com";
process.env.WECHAT_PAY_APP_ID = "wx-smoke-app";
process.env.WECHAT_PAY_MCH_ID = "1900000000";
process.env.WECHAT_PAY_API_KEY = apiV3Key;
process.env.WECHAT_PAY_CERT_SERIAL_NO = "SMOKE_MERCHANT_CERT_SERIAL";
process.env.WECHAT_PAY_PLATFORM_CERT_SERIAL_NO = platformCertSerialNo;

const merchantKeyPair = generateKeyPairSync("rsa", {
  modulusLength: 2048
});
const platformKeyPair = generateKeyPairSync("rsa", {
  modulusLength: 2048
});

process.env.WECHAT_PAY_PRIVATE_KEY = merchantKeyPair.privateKey.export({
  type: "pkcs8",
  format: "pem"
}).toString();
process.env.WECHAT_PAY_PLATFORM_CERTIFICATE = platformKeyPair.publicKey.export({
  type: "spki",
  format: "pem"
}).toString();

console.log("LightQuant signed WeChat notify smoke test");
console.log(
  JSON.stringify(
    {
      dataMode: process.env.LIGHTQUANT_DATA_MODE,
      paymentMode: process.env.LIGHTQUANT_PAYMENT_MODE,
      note:
        "This smoke uses local temporary RSA keys and AES-GCM encryption to verify WeChat notify signature, resource decryption, order crediting, and idempotency. It does not connect to WeChat or print keys."
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
  const { parseAndVerifyWechatNotify } = await import("@/server/payments/providers/wechat-provider");
  const { getRepository } = await import("@/server/repositories");
  const repository = getRepository();
  const accountBefore = await repository.ensureCreditAccount(userId, now);
  const order = await repository.createRechargeOrder({
    orderNo: `LQWXNOTIFY${Date.now()}`,
    userId,
    planId: "starter",
    amountCents: 990,
    points: 1000,
    bonusPoints: 0,
    totalPoints: 1000,
    payChannel: "wechat",
    status: "PENDING",
    clientRequestId: `smoke-wechat-notify-${Date.now()}`,
    paidAt: null,
    closedAt: null,
    createdAt: now,
    updatedAt: now
  });
  const signedNotify = createSignedWechatNotify({
    appid: process.env.WECHAT_PAY_APP_ID ?? "",
    mchid: process.env.WECHAT_PAY_MCH_ID ?? "",
    out_trade_no: order.orderNo,
    transaction_id: `WX${order.orderNo}`,
    trade_state: "SUCCESS",
    amount: {
      total: order.amountCents,
      currency: "CNY"
    }
  });
  const notify = parseAndVerifyWechatNotify(signedNotify.headers, signedNotify.rawBody);

  const firstResult = await handleVerifiedPaymentNotify(
    {
      provider: "wechat",
      orderNo: notify.outTradeNo,
      providerTradeNo: notify.transactionId,
      notifyId: notify.transactionId,
      amountCents: notify.amountCents,
      rawPayload: notify.rawPayload
    },
    "smoke-wechat-notify-request-1"
  );

  assertEqual("wechat-notify-first-order-status", firstResult.order.status, "PAID");
  assertEqual("wechat-notify-first-credit-granted", firstResult.credit.granted, true);
  assertEqual("wechat-notify-first-credit-duplicated", firstResult.credit.duplicated, false);

  const accountAfterFirst = await repository.getCreditAccount(userId);
  assertEqual("wechat-notify-balance-after-first", accountAfterFirst?.balance, accountBefore.balance + order.totalPoints);

  const ledgerPageAfterFirst = await repository.listCreditLedger(userId, {
    page: 1,
    pageSize: 10
  });
  assertEqual("wechat-notify-ledger-count-after-first", ledgerPageAfterFirst.total, 1);
  assertEqual("wechat-notify-ledger-scene", ledgerPageAfterFirst.items[0]?.scene, "recharge");
  assertEqual("wechat-notify-ledger-idempotency", ledgerPageAfterFirst.items[0]?.idempotencyKey, `recharge:${order.id}`);

  const secondResult = await handleVerifiedPaymentNotify(
    {
      provider: "wechat",
      orderNo: notify.outTradeNo,
      providerTradeNo: notify.transactionId,
      notifyId: notify.transactionId,
      amountCents: notify.amountCents,
      rawPayload: notify.rawPayload
    },
    "smoke-wechat-notify-request-2"
  );

  assertEqual("wechat-notify-second-duplicated", secondResult.payment.duplicated, true);
  assertEqual("wechat-notify-second-credit-duplicated", secondResult.credit.duplicated, true);

  const accountAfterSecond = await repository.getCreditAccount(userId);
  const ledgerPageAfterSecond = await repository.listCreditLedger(userId, {
    page: 1,
    pageSize: 10
  });

  assertEqual("wechat-notify-balance-after-second", accountAfterSecond?.balance, accountAfterFirst?.balance);
  assertEqual("wechat-notify-ledger-count-after-second", ledgerPageAfterSecond.total, ledgerPageAfterFirst.total);

  const transaction = await repository.findLatestPaymentTransactionByOrderId(order.id);

  if (!transaction) {
    throw new Error("wechat-notify-transaction missing");
  }

  assertEqual("wechat-notify-transaction-status", transaction.status, "VERIFIED");
  assertEqual("wechat-notify-transaction-provider", transaction.provider, "wechat");
  assertEqual("wechat-notify-transaction-before", transaction.orderStatusBefore, "PENDING");
  assertEqual("wechat-notify-transaction-after", transaction.orderStatusAfter, "PAID");

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

function createSignedWechatNotify(transaction: Record<string, unknown>) {
  const resource = encryptWechatResource(JSON.stringify(transaction));
  const rawBody = JSON.stringify({
    id: `wechat-notify-${transaction.out_trade_no}`,
    create_time: new Date().toISOString().replace(/\.\d{3}Z$/, "+00:00"),
    event_type: "TRANSACTION.SUCCESS",
    resource_type: "encrypt-resource",
    resource
  });
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = randomBytes(16).toString("hex");
  const signText = `${timestamp}\n${nonce}\n${rawBody}\n`;
  const signature = createSign("RSA-SHA256").update(signText, "utf8").sign(platformKeyPair.privateKey, "base64");

  return {
    rawBody,
    headers: new Headers({
      "wechatpay-timestamp": timestamp,
      "wechatpay-nonce": nonce,
      "wechatpay-signature": signature,
      "wechatpay-signature-type": "WECHATPAY2-SHA256-RSA2048",
      "wechatpay-serial": platformCertSerialNo
    })
  };
}

function encryptWechatResource(plainText: string) {
  const nonce = randomBytes(6).toString("hex");
  const associatedData = "transaction";
  const cipher = createCipheriv("aes-256-gcm", Buffer.from(apiV3Key, "utf8"), Buffer.from(nonce, "utf8"));

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

function assertEqual(step: string, actual: unknown, expected: unknown) {
  if (actual !== expected) {
    throw new Error(`${step} failed: expected=${JSON.stringify(expected)}, actual=${JSON.stringify(actual)}`);
  }
}
