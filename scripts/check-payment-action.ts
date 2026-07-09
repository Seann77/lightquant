import { existsSync, readFileSync } from "node:fs";
import { parse as parseDotenv } from "dotenv";
import type { PayChannel, RechargeOrder } from "@/server/domain";

loadEnvFile(".env");
loadEnvFile(".env.local");

const mode = getRequestedMode();
const now = new Date();
const capturedFetches: CapturedFetch[] = [];

main().catch((error) => {
  printResult({
    ok: false,
    envLocalExists: existsSync(".env.local"),
    mode,
    errors: [sanitizeErrorMessage(error)]
  });
  process.exit(1);
});

async function main() {
  if (!isPayChannel(mode)) {
    printResult({
      ok: false,
      mode,
      errors: ["Payment action mode must be mock, alipay, or wechat."]
    });
    process.exit(1);
  }

  if (mode === "wechat") {
    installWechatFetchStub(capturedFetches);
  }

  process.env.LIGHTQUANT_PAYMENT_MODE = mode;

  const { createPaymentAction } = await import("@/server/payments/payment-provider");
  const order = createPreviewOrder(mode, now);
  const action = await createPaymentAction(order);
  const actionDescription = describePaymentAction(action);
  const providerRequest = describeProviderRequest(mode, capturedFetches[0]);
  const errors = validatePreflight(mode, actionDescription, providerRequest);

  printResult({
    ok: errors.length === 0,
    envLocalExists: existsSync(".env.local"),
    mode,
    order: {
      orderNoShape: describeOrderNo(order.orderNo),
      amountCents: order.amountCents,
      totalPoints: order.totalPoints,
      status: order.status
    },
    action: actionDescription,
    providerRequest,
    errors
  });

  if (errors.length > 0) {
    process.exit(1);
  }
}

type CapturedFetch = {
  url: string;
  method: string | null;
  headers: Record<string, string>;
  body: string | null;
};

function loadEnvFile(path: string) {
  if (!existsSync(path)) {
    return;
  }

  Object.assign(process.env, parseDotenv(readFileSync(path)));
}

function getRequestedMode() {
  return getCliValue("--mode") || process.env.PAYMENT_ACTION_CHECK_MODE?.trim() || process.env.LIGHTQUANT_PAYMENT_MODE?.trim() || "mock";
}

function getCliValue(name: string) {
  const prefix = `${name}=`;
  const inline = process.argv.find((arg) => arg.startsWith(prefix));

  if (inline) {
    return inline.slice(prefix.length).trim();
  }

  const index = process.argv.indexOf(name);
  if (index >= 0) {
    return process.argv[index + 1]?.trim() ?? "";
  }

  return "";
}

function isPayChannel(value: string): value is PayChannel {
  return value === "mock" || value === "alipay" || value === "wechat";
}

function createPreviewOrder(payChannel: PayChannel, date: Date): RechargeOrder {
  const createdAt = date.toISOString();

  return {
    id: "payment-action-preflight-order-id",
    orderNo: `LQPRE${date.toISOString().replace(/\D/g, "").slice(0, 14)}000001`,
    userId: "payment-action-preflight-user-id",
    planId: "monthly_plus",
    amountCents: 1,
    points: 6000,
    bonusPoints: 0,
    totalPoints: 6000,
    payChannel,
    status: "PENDING",
    clientRequestId: "payment-action-preflight",
    paidAt: null,
    closedAt: null,
    createdAt,
    updatedAt: createdAt
  };
}

function installWechatFetchStub(capturedFetches: CapturedFetch[]) {
  globalThis.fetch = async (input: string | URL | Request, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    capturedFetches.push({
      url: String(input),
      method: init?.method ?? null,
      headers: Object.fromEntries(headers.entries()),
      body: typeof init?.body === "string" ? init.body : null
    });

    return new Response(
      JSON.stringify({
        code_url: "weixin://wxpay/bizpayurl?pr=lightquant-preflight"
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
  if (!action || typeof action !== "object") {
    return {
      valid: false
    };
  }

  const value = action as Record<string, unknown>;
  const description: Record<string, unknown> = {
    valid: true,
    type: value.type,
    provider: value.provider,
    payChannel: value.payChannel,
    status: value.status,
    hasOrderId: typeof value.orderId === "string" && value.orderId.length > 0,
    hasOrderNo: typeof value.orderNo === "string" && value.orderNo.length > 0,
    amountCents: value.amountCents,
    totalPoints: value.totalPoints,
    hasPollUrl: typeof value.pollUrl === "string" && value.pollUrl.startsWith("/api/v1/payments/"),
    expiresAtValid: isValidIsoDate(value.expiresAt)
  };

  if (value.type === "redirect" && typeof value.redirectUrl === "string") {
    description.redirect = describeRedirectUrl(value.redirectUrl);
  }

  if ((value.type === "qr_code" || value.type === "mock") && typeof value.qrCodeText === "string") {
    description.qrCode = {
      configured: true,
      scheme: getUrlScheme(value.qrCodeText),
      length: value.qrCodeText.length
    };
  }

  if (value.type === "mock") {
    description.mockPaymentUrlConfigured = typeof value.mockPaymentUrl === "string";
  }

  return description;
}

function describeRedirectUrl(value: string) {
  try {
    const url = new URL(value);
    const params = url.searchParams;
    const bizContent = parseJsonObject(params.get("biz_content"));

    return {
      configured: true,
      hostType: getHostType(url.hostname),
      protocol: url.protocol,
      method: params.get("method"),
      signType: params.get("sign_type"),
      appIdConfigured: Boolean(params.get("app_id")),
      hasSign: Boolean(params.get("sign")),
      hasNotifyUrl: Boolean(params.get("notify_url")),
      hasReturnUrl: Boolean(params.get("return_url")),
      notifyUrl: describeNestedUrl(params.get("notify_url")),
      returnUrl: describeNestedUrl(params.get("return_url")),
      totalAmount: typeof bizContent?.total_amount === "string" ? bizContent.total_amount : null,
      outTradeNoConfigured: Boolean(bizContent?.out_trade_no),
      productCode: typeof bizContent?.product_code === "string" ? bizContent.product_code : null,
      subject: typeof bizContent?.subject === "string" ? bizContent.subject : null,
      body: typeof bizContent?.body === "string" ? bizContent.body : null,
      timeoutExpress: typeof bizContent?.timeout_express === "string" ? bizContent.timeout_express : null,
      timeoutMatchesConfig: bizContent?.timeout_express === `${readPositiveInteger("PAYMENT_ORDER_EXPIRE_MINUTES", 5)}m`
    };
  } catch {
    return {
      configured: true,
      validUrl: false
    };
  }
}

function describeProviderRequest(mode: PayChannel, capturedFetch?: CapturedFetch) {
  if (mode !== "wechat") {
    return null;
  }

  if (!capturedFetch) {
    return {
      captured: false
    };
  }

  const body = parseJsonObject(capturedFetch.body);

  return {
    captured: true,
    method: capturedFetch.method,
    requestUrl: describeNestedUrl(capturedFetch.url),
    hasAuthorization: Boolean(capturedFetch.headers.authorization),
    contentType: capturedFetch.headers["content-type"] ?? null,
    appIdConfigured: Boolean(body?.appid),
    mchIdConfigured: Boolean(body?.mchid),
    hasOutTradeNo: Boolean(body?.out_trade_no),
    hasNotifyUrl: Boolean(body?.notify_url),
    notifyUrl: typeof body?.notify_url === "string" ? describeNestedUrl(body.notify_url) : null,
    amountCents: isRecord(body?.amount) ? body.amount.total : null,
    description: typeof body?.description === "string" ? body.description : null,
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
      path: url.pathname,
      paymentReturn: url.searchParams.get("paymentReturn"),
      orderId: url.searchParams.get("orderId")
    };
  } catch {
    return {
      configured: true,
      validUrl: false
    };
  }
}

function getHostType(hostname: string) {
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "local";
  }

  if (hostname.endsWith(".alipay.com")) {
    return "alipay";
  }

  if (hostname.endsWith(".qq.com") || hostname.endsWith(".weixin.qq.com")) {
    return "wechat";
  }

  return "other";
}

function describeOrderNo(value: string) {
  return {
    length: value.length,
    startsWithLightQuantPrefix: value.startsWith("LQ")
  };
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

function validatePreflight(mode: PayChannel, action: Record<string, unknown>, providerRequest: Record<string, unknown> | null) {
  const errors: string[] = [];

  if (action.valid !== true) {
    errors.push("Payment action is not valid.");
  }

  if (action.type !== expectedActionType(mode)) {
    errors.push(`Payment action type mismatch for ${mode}.`);
  }

  if (mode === "alipay") {
    const redirect = isRecord(action.redirect) ? action.redirect : null;

    if (redirect?.timeoutMatchesConfig !== true) {
      errors.push("Alipay timeout_express does not match PAYMENT_ORDER_EXPIRE_MINUTES.");
    }

    if (redirect?.subject !== "LightQuant 月卡 Plus（6000积分/30天）") {
      errors.push("Alipay subject must describe monthly Plus instead of generic credits.");
    }

    if (redirect?.body !== "月卡积分 30 天内有效，优先消耗") {
      errors.push("Alipay body must describe monthly validity and priority consumption.");
    }

    const returnUrl = isRecord(redirect?.returnUrl) ? redirect.returnUrl : null;
    if (returnUrl?.path !== "/credits") {
      errors.push("Alipay return_url path must be /credits.");
    }

    if (returnUrl?.paymentReturn !== "1") {
      errors.push("Alipay return_url must include paymentReturn=1.");
    }

    if (returnUrl?.orderId !== "payment-action-preflight-order-id") {
      errors.push("Alipay return_url must include the orderId query parameter.");
    }
  }

  if (mode === "wechat") {
    if (providerRequest?.captured !== true || providerRequest.timeExpireConfigured !== true) {
      errors.push("WeChat native prepay request is missing time_expire.");
    }

    if (providerRequest?.timeExpireFormatValid !== true) {
      errors.push("WeChat native prepay time_expire must be second-level RFC3339 with timezone.");
    }

    if (providerRequest?.description !== "LightQuant 月卡 Plus（6000积分/30天）") {
      errors.push("WeChat native prepay description must describe monthly Plus.");
    }
  }

  return errors;
}

function expectedActionType(mode: PayChannel) {
  if (mode === "alipay") {
    return "redirect";
  }

  if (mode === "wechat") {
    return "qr_code";
  }

  return "mock";
}

function readPositiveInteger(name: string, fallback: number) {
  const value = Number(process.env[name] ?? fallback);

  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}

function isWechatRfc3339(value: string) {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/.test(value);
}

function sanitizeErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  return message
    .replace(/postgres(?:ql)?:\/\/[^\s]+/gi, "postgresql://***")
    .replace(/(app_id|mchid|serial_no|signature|private_key|api_key)=\"?[A-Za-z0-9+/=_-]+\"?/gi, "$1=***")
    .replace(/-----BEGIN[\s\S]+?-----END [A-Z ]+-----/g, "-----BEGIN ***-----");
}

function printResult(value: unknown) {
  console.log(JSON.stringify(value, null, 2));
}
