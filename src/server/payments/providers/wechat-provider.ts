import { createDecipheriv, createSign, createVerify, randomUUID } from "crypto";
import type { RechargeOrder } from "@/server/domain";
import { ApiError } from "@/server/http/api-response";
import { getOrderExpiresAt, getWechatPayConfig, joinUrl } from "@/server/payments/payment-config";
import { basePaymentAction, type PaymentAction } from "@/server/payments/payment-action";

type WechatNotify = {
  appId: string;
  mchId: string;
  outTradeNo: string;
  transactionId: string;
  tradeState: string;
  amountCents: number;
  rawPayload: Record<string, unknown>;
};

type WechatResource = {
  algorithm?: string;
  ciphertext?: string;
  associated_data?: string;
  nonce?: string;
};

const WECHAT_NOTIFY_MAX_SKEW_SECONDS = 5 * 60;

export async function createWechatPaymentAction(order: RechargeOrder): Promise<PaymentAction> {
  const config = getWechatPayConfig();
  const body = JSON.stringify({
    appid: config.appId,
    mchid: config.mchId,
    description: `LightQuant ${order.totalPoints} 积分充值`,
    out_trade_no: order.orderNo,
    time_expire: getWechatExpireTime(order.createdAt),
    notify_url: config.notifyUrl,
    amount: {
      total: order.amountCents,
      currency: "CNY"
    }
  });
  const path = "/v3/pay/transactions/native";
  const response = await fetch(joinUrl(config.gatewayUrl, path), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: createWechatAuthorization("POST", path, body)
    },
    body
  });
  const payload = await response.json().catch(() => ({})) as { code_url?: string };

  if (!response.ok || !payload.code_url) {
    throw new ApiError("PAYMENT_PROVIDER_ERROR", "微信支付下单失败", 502);
  }

  return {
    ...basePaymentAction(order),
    type: "qr_code",
    qrCodeText: payload.code_url
  };
}

export function parseAndVerifyWechatNotify(headers: Headers, rawBody: string): WechatNotify {
  const config = getWechatPayConfig();
  const timestamp = headers.get("wechatpay-timestamp") ?? "";
  const nonce = headers.get("wechatpay-nonce") ?? "";
  const signature = headers.get("wechatpay-signature") ?? "";
  const serial = headers.get("wechatpay-serial") ?? "";
  const signatureType = headers.get("wechatpay-signature-type") ?? "";

  if (!timestamp || !nonce || !signature || !serial || !signatureType) {
    throw new ApiError("PAYMENT_VERIFY_FAILED", "支付通知验签失败", 400);
  }

  if (signatureType !== "WECHATPAY2-SHA256-RSA2048") {
    throw new ApiError("PAYMENT_VERIFY_FAILED", "支付通知签名类型不匹配", 400);
  }

  if (!isFreshWechatTimestamp(timestamp)) {
    throw new ApiError("PAYMENT_VERIFY_FAILED", "支付通知时间无效", 400);
  }

  if (config.platformCertSerialNo && serial !== config.platformCertSerialNo) {
    throw new ApiError("PAYMENT_VERIFY_FAILED", "支付通知平台证书不匹配", 400);
  }

  const signText = `${timestamp}\n${nonce}\n${rawBody}\n`;
  const verified = createVerify("RSA-SHA256").update(signText, "utf8").verify(config.platformCertificate, signature, "base64");

  if (!verified) {
    throw new ApiError("PAYMENT_VERIFY_FAILED", "支付通知验签失败", 400);
  }

  const payload = parseJsonObject(rawBody);
  const resource = payload.resource as WechatResource | undefined;

  if (resource?.algorithm !== "AEAD_AES_256_GCM" || !resource.ciphertext || !resource.nonce) {
    throw new ApiError("VALIDATION_ERROR", "支付通知参数不完整", 400);
  }

  const decrypted = decryptWechatResource(resource, config.apiV3Key);
  const transaction = parseJsonObject(decrypted);

  if (transaction.appid !== config.appId || transaction.mchid !== config.mchId) {
    throw new ApiError("PAYMENT_VERIFY_FAILED", "支付通知商户不匹配", 400);
  }

  if (transaction.trade_state !== "SUCCESS") {
    throw new ApiError("PAYMENT_VERIFY_FAILED", "支付通知状态未成功", 400);
  }

  const amount = transaction.amount as { total?: number } | undefined;
  const amountCents = Number(amount?.total);
  const outTradeNo = typeof transaction.out_trade_no === "string" ? transaction.out_trade_no : "";
  const transactionId = typeof transaction.transaction_id === "string" ? transaction.transaction_id : "";

  if (!outTradeNo || !transactionId || !Number.isInteger(amountCents)) {
    throw new ApiError("VALIDATION_ERROR", "支付通知参数不完整", 400);
  }

  return {
    appId: String(transaction.appid),
    mchId: String(transaction.mchid),
    outTradeNo,
    transactionId,
    tradeState: String(transaction.trade_state),
    amountCents,
    rawPayload: {
      id: payload.id,
      create_time: payload.create_time,
      event_type: payload.event_type,
      resource_type: payload.resource_type,
      transaction
    }
  };
}

function createWechatAuthorization(method: string, path: string, body: string) {
  const config = getWechatPayConfig();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = randomUUID().replace(/-/g, "");
  const message = `${method}\n${path}\n${timestamp}\n${nonce}\n${body}\n`;
  const signature = createSign("RSA-SHA256").update(message, "utf8").sign(config.privateKey, "base64");

  return `WECHATPAY2-SHA256-RSA2048 mchid="${config.mchId}",nonce_str="${nonce}",timestamp="${timestamp}",serial_no="${config.certSerialNo}",signature="${signature}"`;
}

function isFreshWechatTimestamp(value: string) {
  if (!/^\d{10}$/.test(value)) {
    return false;
  }

  const timestampSeconds = Number(value);
  const nowSeconds = Math.floor(Date.now() / 1000);

  return Math.abs(nowSeconds - timestampSeconds) <= WECHAT_NOTIFY_MAX_SKEW_SECONDS;
}

function decryptWechatResource(resource: WechatResource, apiV3Key: string) {
  const ciphertext = Buffer.from(resource.ciphertext ?? "", "base64");
  const authTag = ciphertext.subarray(ciphertext.length - 16);
  const encrypted = ciphertext.subarray(0, ciphertext.length - 16);
  const decipher = createDecipheriv("aes-256-gcm", Buffer.from(apiV3Key, "utf8"), Buffer.from(resource.nonce ?? "", "utf8"));

  if (resource.associated_data) {
    decipher.setAAD(Buffer.from(resource.associated_data, "utf8"));
  }

  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

function parseJsonObject(value: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(value);

    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // Fall through to stable API error below.
  }

  throw new ApiError("VALIDATION_ERROR", "支付通知参数不完整", 400);
}

function getWechatExpireTime(createdAt: string) {
  return formatWechatRfc3339(getOrderExpiresAt(createdAt));
}

function formatWechatRfc3339(value: string) {
  return new Date(value).toISOString().replace(/\.\d{3}Z$/, "+00:00");
}
