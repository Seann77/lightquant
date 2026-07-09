import { createSign, createVerify } from "crypto";
import type { RechargeOrder } from "@/server/domain";
import { ApiError } from "@/server/http/api-response";
import { getAlipayConfig, getPaymentOrderExpireMinutes, joinUrl } from "@/server/payments/payment-config";
import { basePaymentAction, type PaymentAction } from "@/server/payments/payment-action";
import { getPaymentProductCopy } from "@/server/payments/payment-product-copy";

type AlipayNotify = {
  appId: string;
  outTradeNo: string;
  tradeNo: string;
  notifyId: string;
  tradeStatus: string;
  totalAmountCents: number;
  sellerId: string | null;
  rawPayload: Record<string, string>;
};

export function createAlipayPaymentAction(order: RechargeOrder): PaymentAction {
  const config = getAlipayConfig();
  const returnUrl = joinUrl(config.returnBaseUrl, `/credits?paymentReturn=1&orderId=${encodeURIComponent(order.id)}`);
  const productCopy = getPaymentProductCopy(order);
  const bizContent = JSON.stringify({
    out_trade_no: order.orderNo,
    product_code: "FAST_INSTANT_TRADE_PAY",
    total_amount: centsToAmount(order.amountCents),
    subject: productCopy.subject,
    body: productCopy.body,
    timeout_express: `${getPaymentOrderExpireMinutes()}m`
  });
  const params: Record<string, string> = {
    app_id: config.appId,
    method: "alipay.trade.page.pay",
    format: "JSON",
    charset: "utf-8",
    sign_type: "RSA2",
    timestamp: formatAlipayTimestamp(new Date()),
    version: "1.0",
    notify_url: config.notifyUrl,
    return_url: returnUrl,
    biz_content: bizContent
  };
  logAlipayReturnUrl(returnUrl, order.id);
  const signText = buildAlipaySignText(params);
  const sign = createSign("RSA-SHA256").update(signText, "utf8").sign(config.privateKey, "base64");
  const redirectUrl = `${config.gatewayUrl}?${new URLSearchParams({
    ...params,
    sign
  }).toString()}`;

  return {
    ...basePaymentAction(order),
    type: "redirect",
    redirectUrl
  };
}

export function parseAndVerifyAlipayNotify(form: FormData): AlipayNotify {
  const config = getAlipayConfig();
  const payload: Record<string, string> = {};

  for (const [key, value] of form.entries()) {
    if (typeof value === "string") {
      payload[key] = value;
    }
  }

  const signature = payload.sign;

  if (!signature) {
    throw new ApiError("PAYMENT_VERIFY_FAILED", "支付通知验签失败", 400);
  }

  const signType = payload.sign_type ?? "RSA2";
  const verifyAlgorithm = signType === "RSA2" ? "RSA-SHA256" : "RSA-SHA1";
  const signText = buildAlipaySignText(payload);
  let verified = createVerify(verifyAlgorithm).update(signText, "utf8").verify(config.publicKey, signature, "base64");

  if (!verified && payload.sign_type) {
    const legacySignText = buildAlipaySignText(payload, { excludeSignType: true });
    verified = createVerify(verifyAlgorithm).update(legacySignText, "utf8").verify(config.publicKey, signature, "base64");
  }

  if (!verified) {
    throw new ApiError("PAYMENT_VERIFY_FAILED", "支付通知验签失败", 400);
  }

  if (payload.app_id !== config.appId) {
    throw new ApiError("PAYMENT_VERIFY_FAILED", "支付通知应用不匹配", 400);
  }

  if (config.sellerId && payload.seller_id !== config.sellerId) {
    throw new ApiError("PAYMENT_VERIFY_FAILED", "支付通知商户不匹配", 400);
  }

  const tradeStatus = payload.trade_status ?? "";

  if (tradeStatus !== "TRADE_SUCCESS" && tradeStatus !== "TRADE_FINISHED") {
    throw new ApiError("PAYMENT_VERIFY_FAILED", "支付通知状态未成功", 400);
  }

  const outTradeNo = payload.out_trade_no;
  const tradeNo = payload.trade_no;
  const notifyId = payload.notify_id ?? tradeNo;
  const totalAmountCents = amountToCents(payload.total_amount);

  if (!outTradeNo || !tradeNo || !notifyId || !Number.isInteger(totalAmountCents)) {
    throw new ApiError("VALIDATION_ERROR", "支付通知参数不完整", 400);
  }

  return {
    appId: payload.app_id,
    outTradeNo,
    tradeNo,
    notifyId,
    tradeStatus,
    totalAmountCents,
    sellerId: payload.seller_id ?? null,
    rawPayload: sanitizeAlipayPayload(payload)
  };
}

function buildAlipaySignText(params: Record<string, string>, options?: { excludeSignType?: boolean }) {
  return Object.keys(params)
    .filter((key) => key !== "sign" && (!options?.excludeSignType || key !== "sign_type") && params[key] !== "")
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
}

function centsToAmount(cents: number) {
  return (cents / 100).toFixed(2);
}

function amountToCents(value: string | undefined) {
  if (!value || !/^\d+(\.\d{1,2})?$/.test(value)) {
    return Number.NaN;
  }

  return Math.round(Number(value) * 100);
}

function formatAlipayTimestamp(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function logAlipayReturnUrl(returnUrl: string, orderId: string) {
  try {
    const url = new URL(returnUrl);

    console.info(
      JSON.stringify({
        event: "alipay.return_url.generated",
        orderId,
        returnUrl: {
          origin: url.origin,
          path: url.pathname,
          search: url.search
        }
      })
    );
  } catch {
    console.info(
      JSON.stringify({
        event: "alipay.return_url.generated",
        orderId,
        returnUrl: {
          invalid: true
        }
      })
    );
  }
}

function sanitizeAlipayPayload(payload: Record<string, string>) {
  const sanitized = { ...payload };
  delete sanitized.sign;

  return sanitized;
}
