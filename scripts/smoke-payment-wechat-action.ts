import { generateKeyPairSync } from "node:crypto";
import type { PayChannel, RechargeOrder } from "@/server/domain";

type CapturedFetch = {
  url: string;
  method: string | null;
  headers: Record<string, string>;
  body: string | null;
};

const capturedFetches: CapturedFetch[] = [];
const now = new Date();

process.env.LIGHTQUANT_DATA_MODE = "mock";
process.env.LIGHTQUANT_PAYMENT_MODE = "wechat";
process.env.PAYMENT_MOCK_ENABLED = "false";
process.env.PAYMENT_NOTIFY_BASE_URL = "https://pay.example.com";
process.env.PAYMENT_ORDER_EXPIRE_MINUTES = "30";
process.env.WECHAT_PAY_APP_ID = "wx-smoke-action-app";
process.env.WECHAT_PAY_MCH_ID = "1900000000";
process.env.WECHAT_PAY_API_KEY = "12345678901234567890123456789012";
process.env.WECHAT_PAY_CERT_SERIAL_NO = "SMOKE_MERCHANT_CERT_SERIAL";
process.env.WECHAT_PAY_PLATFORM_CERT_SERIAL_NO = "SMOKE_PLATFORM_CERT_SERIAL";
process.env.WECHAT_PAY_GATEWAY_URL = "https://api.mch.weixin.qq.com";

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

installWechatFetchStub(capturedFetches);

console.log("LightQuant WeChat Native paymentAction smoke test");
console.log(
  JSON.stringify(
    {
      dataMode: process.env.LIGHTQUANT_DATA_MODE,
      paymentMode: process.env.LIGHTQUANT_PAYMENT_MODE,
      note:
        "This smoke uses temporary local RSA keys and a fetch stub to verify WeChat Native prepay request shape and qr_code paymentAction. It does not connect to WeChat, create real orders, grant credits, or print keys."
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
        error: sanitizeErrorMessage(error)
      },
      null,
      2
    )
  );
  process.exitCode = 1;
});

async function main() {
  const { createPaymentAction } = await import("@/server/payments/payment-provider");
  const order = createPreviewOrder("wechat", now);
  const action = await createPaymentAction(order);
  const actionDescription = describePaymentAction(action);
  const requestDescription = describeProviderRequest(capturedFetches[0]);
  const errors = validateResult(actionDescription, requestDescription, order);

  console.log(
    JSON.stringify(
      {
        ok: errors.length === 0,
        order: {
          orderNoShape: describeOrderNo(order.orderNo),
          amountCents: order.amountCents,
          totalPoints: order.totalPoints,
          payChannel: order.payChannel,
          status: order.status
        },
        action: actionDescription,
        providerRequest: requestDescription,
        errors
      },
      null,
      2
    )
  );

  if (errors.length > 0) {
    process.exitCode = 1;
  }
}

function createPreviewOrder(payChannel: PayChannel, date: Date): RechargeOrder {
  const createdAt = date.toISOString();

  return {
    id: "wechat-action-smoke-order-id",
    orderNo: `LQWXACTION${date.toISOString().replace(/\D/g, "").slice(0, 14)}`,
    userId: "wechat-action-smoke-user-id",
    planId: "starter",
    amountCents: 990,
    points: 1000,
    bonusPoints: 0,
    totalPoints: 1000,
    payChannel,
    status: "PENDING",
    clientRequestId: "wechat-action-smoke-client-request",
    paidAt: null,
    closedAt: null,
    createdAt,
    updatedAt: createdAt
  };
}

function installWechatFetchStub(captured: CapturedFetch[]) {
  globalThis.fetch = async (input: string | URL | Request, init?: RequestInit) => {
    const headers = new Headers(init?.headers);

    captured.push({
      url: String(input),
      method: init?.method ?? null,
      headers: Object.fromEntries(headers.entries()),
      body: typeof init?.body === "string" ? init.body : null
    });

    return new Response(
      JSON.stringify({
        code_url: "weixin://wxpay/bizpayurl?pr=lightquant-action-smoke"
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  };
}

function describePaymentAction(action: unknown) {
  if (!isRecord(action)) {
    return {
      valid: false
    };
  }

  return {
    valid: true,
    type: action.type,
    provider: action.provider,
    payChannel: action.payChannel,
    status: action.status,
    hasOrderId: typeof action.orderId === "string" && action.orderId.length > 0,
    hasOrderNo: typeof action.orderNo === "string" && action.orderNo.length > 0,
    amountCents: action.amountCents,
    totalPoints: action.totalPoints,
    hasPollUrl: typeof action.pollUrl === "string" && action.pollUrl === `/api/v1/payments/${action.orderId}/status`,
    expiresAtValid: isValidIsoDate(action.expiresAt),
    qrCode: typeof action.qrCodeText === "string"
      ? {
          configured: true,
          scheme: getUrlScheme(action.qrCodeText),
          length: action.qrCodeText.length
        }
      : {
          configured: false
        }
  };
}

function describeProviderRequest(capturedFetch?: CapturedFetch) {
  if (!capturedFetch) {
    return {
      captured: false
    };
  }

  const body = parseJsonObject(capturedFetch.body);
  const notifyUrl = typeof body?.notify_url === "string" ? describeNestedUrl(body.notify_url) : null;
  const requestUrl = describeNestedUrl(capturedFetch.url);
  const authorization = capturedFetch.headers.authorization ?? "";

  return {
    captured: true,
    method: capturedFetch.method,
    requestUrl,
    contentType: capturedFetch.headers["content-type"] ?? null,
    authorizationScheme: authorization.startsWith("WECHATPAY2-SHA256-RSA2048") ? "WECHATPAY2-SHA256-RSA2048" : null,
    authorizationHasMchId: authorization.includes('mchid="1900000000"'),
    authorizationHasNonce: authorization.includes("nonce_str="),
    authorizationHasTimestamp: authorization.includes("timestamp="),
    authorizationHasSerialNo: authorization.includes("serial_no="),
    authorizationHasSignature: authorization.includes("signature="),
    appIdConfigured: Boolean(body?.appid),
    mchIdConfigured: Boolean(body?.mchid),
    descriptionConfigured: typeof body?.description === "string" && body.description.includes("LightQuant"),
    outTradeNoConfigured: Boolean(body?.out_trade_no),
    notifyUrl,
    amountCents: isRecord(body?.amount) ? body.amount.total : null,
    currency: isRecord(body?.amount) ? body.amount.currency : null,
    timeExpireConfigured: Boolean(body?.time_expire),
    timeExpire: typeof body?.time_expire === "string" ? body.time_expire : null,
    timeExpireFormatValid: typeof body?.time_expire === "string" && isWechatRfc3339(body.time_expire)
  };
}

function describeNestedUrl(value: unknown) {
  if (typeof value !== "string" || !value) {
    return {
      configured: false
    };
  }

  try {
    const url = new URL(value);

    return {
      configured: true,
      validUrl: true,
      protocol: url.protocol,
      hostType: getHostType(url.hostname),
      path: url.pathname
    };
  } catch {
    return {
      configured: true,
      validUrl: false
    };
  }
}

function validateResult(action: Record<string, unknown>, providerRequest: Record<string, unknown>, order: RechargeOrder) {
  const errors: string[] = [];

  expect(errors, "paymentAction must be valid", action.valid === true);
  expect(errors, "paymentAction type must be qr_code", action.type === "qr_code");
  expect(errors, "paymentAction provider must be wechat", action.provider === "wechat");
  expect(errors, "paymentAction amount must match order snapshot", action.amountCents === order.amountCents);
  expect(errors, "paymentAction points must match order snapshot", action.totalPoints === order.totalPoints);
  expect(errors, "paymentAction qr code must use weixin scheme", isRecord(action.qrCode) && action.qrCode.scheme === "weixin");
  expect(errors, "provider request must be captured", providerRequest.captured === true);
  expect(errors, "provider request method must be POST", providerRequest.method === "POST");
  expect(
    errors,
    "provider request URL must target WeChat Native prepay endpoint",
    isRecord(providerRequest.requestUrl) &&
      providerRequest.requestUrl.protocol === "https:" &&
      providerRequest.requestUrl.hostType === "wechat" &&
      providerRequest.requestUrl.path === "/v3/pay/transactions/native"
  );
  expect(errors, "provider request must include WeChat authorization scheme", providerRequest.authorizationScheme === "WECHATPAY2-SHA256-RSA2048");
  expect(errors, "provider request authorization must include mchid", providerRequest.authorizationHasMchId === true);
  expect(errors, "provider request authorization must include nonce", providerRequest.authorizationHasNonce === true);
  expect(errors, "provider request authorization must include timestamp", providerRequest.authorizationHasTimestamp === true);
  expect(errors, "provider request authorization must include serial number", providerRequest.authorizationHasSerialNo === true);
  expect(errors, "provider request authorization must include signature", providerRequest.authorizationHasSignature === true);
  expect(errors, "provider request must include appid", providerRequest.appIdConfigured === true);
  expect(errors, "provider request must include mchid", providerRequest.mchIdConfigured === true);
  expect(errors, "provider request must include LightQuant description", providerRequest.descriptionConfigured === true);
  expect(errors, "provider request must include out_trade_no", providerRequest.outTradeNoConfigured === true);
  expect(errors, "provider request amount must match order snapshot", providerRequest.amountCents === order.amountCents);
  expect(errors, "provider request currency must be CNY", providerRequest.currency === "CNY");
  expect(errors, "provider request must include a valid HTTPS notify_url", isRecord(providerRequest.notifyUrl) && providerRequest.notifyUrl.protocol === "https:" && providerRequest.notifyUrl.path === "/api/v1/payments/wechat/notify");
  expect(errors, "provider request must include time_expire", providerRequest.timeExpireConfigured === true);
  expect(errors, "provider request time_expire must be second-level RFC3339", providerRequest.timeExpireFormatValid === true);

  return errors;
}

function expect(errors: string[], message: string, condition: boolean) {
  if (!condition) {
    errors.push(message);
  }
}

function describeOrderNo(value: string) {
  return {
    length: value.length,
    startsWithLightQuantPrefix: value.startsWith("LQ")
  };
}

function getHostType(hostname: string) {
  if (hostname.endsWith(".qq.com") || hostname.endsWith(".weixin.qq.com")) {
    return "wechat";
  }

  return "other";
}

function isValidIsoDate(value: unknown) {
  return typeof value === "string" && Number.isFinite(new Date(value).getTime());
}

function getUrlScheme(value: string) {
  const match = value.match(/^([a-z][a-z0-9+.-]*):/i);

  return match?.[1] ?? "none";
}

function parseJsonObject(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "string" || !value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value);

    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isWechatRfc3339(value: string) {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/.test(value);
}

function sanitizeErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  return message
    .replace(/(mchid|serial_no|signature|private_key|api_key)="?[A-Za-z0-9+/=_-]+"?/gi, "$1=***")
    .replace(/-----BEGIN[\s\S]+?-----END [A-Z ]+-----/g, "-----BEGIN ***-----");
}
