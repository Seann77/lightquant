import type { PayChannel } from "@/server/domain";
import { getPaymentMode, ServerConfigError } from "@/server/env";
import { ApiError } from "@/server/http/api-response";

export type PaymentMode = "mock" | "wechat" | "alipay";

type PaymentConfig = {
  mode: PaymentMode;
  mockEnabled: boolean;
  notifyBaseUrl: string | null;
  returnBaseUrl: string | null;
  orderExpireMinutes: number;
};

export type PaymentChannelAvailability = {
  id: PayChannel;
  label: string;
  enabled: boolean;
  current: boolean;
};

export type AlipayConfig = {
  appId: string;
  privateKey: string;
  publicKey: string;
  sellerId: string | null;
  gatewayUrl: string;
  notifyUrl: string;
  returnBaseUrl: string;
};

export type WechatPayConfig = {
  appId: string;
  mchId: string;
  apiV3Key: string;
  certSerialNo: string;
  privateKey: string;
  platformCertSerialNo: string | null;
  platformCertificate: string;
  gatewayUrl: string;
  notifyUrl: string;
};

const DEFAULT_ORDER_EXPIRE_MINUTES = 30;
const DEFAULT_ALIPAY_GATEWAY = "https://openapi.alipay.com/gateway.do";
const DEFAULT_WECHAT_GATEWAY = "https://api.mch.weixin.qq.com";
const PAYMENT_CHANNELS: Array<{ id: PayChannel; label: string }> = [
  { id: "mock", label: "模拟支付" },
  { id: "wechat", label: "微信支付" },
  { id: "alipay", label: "支付宝" }
];

export function getPaymentConfig(): PaymentConfig {
  let mode: PaymentMode;

  try {
    mode = getPaymentMode();
  } catch (error) {
    if (error instanceof ServerConfigError) {
      throw new ApiError("PAYMENT_CONFIG_ERROR", "支付配置不可用", 500);
    }

    throw error;
  }

  const mockEnabled = process.env.PAYMENT_MOCK_ENABLED !== "false";

  if (process.env.NODE_ENV === "production" && mockEnabled) {
    throw new ApiError("PAYMENT_CONFIG_ERROR", "生产环境不允许启用模拟支付", 500);
  }

  return {
    mode,
    mockEnabled,
    notifyBaseUrl: normalizeOptional(process.env.PAYMENT_NOTIFY_BASE_URL),
    returnBaseUrl: normalizeOptional(process.env.PAYMENT_RETURN_BASE_URL),
    orderExpireMinutes: getPaymentOrderExpireMinutes()
  };
}

export function assertPayChannelAvailable(payChannel: PayChannel) {
  const config = getPaymentConfig();

  if (config.mode === "mock") {
    if (!config.mockEnabled || payChannel !== "mock") {
      throw new ApiError("PAYMENT_CONFIG_ERROR", "当前仅启用模拟支付", 500);
    }

    return;
  }

  if (payChannel !== config.mode) {
    throw new ApiError("PAYMENT_CONFIG_ERROR", "支付渠道未启用", 500);
  }

  if (payChannel === "alipay") {
    getAlipayConfig();
    return;
  }

  getWechatPayConfig();
}

export function assertMockPaymentAvailable() {
  const config = getPaymentConfig();

  if (config.mode !== "mock" || !config.mockEnabled || process.env.NODE_ENV === "production") {
    throw new ApiError("PAYMENT_CONFIG_ERROR", "当前环境未启用模拟支付", 500);
  }
}

export function listPaymentChannelAvailability(): PaymentChannelAvailability[] {
  const config = getPaymentConfig();

  return PAYMENT_CHANNELS.map((channel) => ({
    ...channel,
    enabled: isPaymentChannelConfigured(channel.id, config),
    current: channel.id === config.mode
  }));
}

export function getAlipayConfig(): AlipayConfig {
  const config = getPaymentConfig();

  if (config.mode !== "alipay") {
    throw new ApiError("PAYMENT_CONFIG_ERROR", "支付宝支付未启用", 500);
  }

  const notifyBaseUrl = requireHttpsUrl(requireConfiguredValue(config.notifyBaseUrl, "PAYMENT_NOTIFY_BASE_URL"), "PAYMENT_NOTIFY_BASE_URL");
  const returnBaseUrl = config.returnBaseUrl ? requireHttpsUrl(config.returnBaseUrl, "PAYMENT_RETURN_BASE_URL") : notifyBaseUrl;
  const gatewayUrl = requireHttpsUrl(normalizeOptional(process.env.ALIPAY_GATEWAY_URL) ?? DEFAULT_ALIPAY_GATEWAY, "ALIPAY_GATEWAY_URL");

  return {
    appId: requireEnv("ALIPAY_APP_ID"),
    privateKey: normalizePem(requireEnv("ALIPAY_PRIVATE_KEY"), "PRIVATE KEY"),
    publicKey: normalizePem(requireEnv("ALIPAY_PUBLIC_KEY"), "PUBLIC KEY"),
    sellerId: normalizeOptional(process.env.ALIPAY_SELLER_ID),
    gatewayUrl,
    notifyUrl: joinUrl(notifyBaseUrl, "/api/v1/payments/alipay/notify"),
    returnBaseUrl
  };
}

export function getWechatPayConfig(): WechatPayConfig {
  const config = getPaymentConfig();

  if (config.mode !== "wechat") {
    throw new ApiError("PAYMENT_CONFIG_ERROR", "微信支付未启用", 500);
  }

  const notifyBaseUrl = requireHttpsUrl(requireConfiguredValue(config.notifyBaseUrl, "PAYMENT_NOTIFY_BASE_URL"), "PAYMENT_NOTIFY_BASE_URL");
  const gatewayUrl = requireHttpsUrl(normalizeOptional(process.env.WECHAT_PAY_GATEWAY_URL) ?? DEFAULT_WECHAT_GATEWAY, "WECHAT_PAY_GATEWAY_URL");

  return {
    appId: requireEnv("WECHAT_PAY_APP_ID"),
    mchId: requireEnv("WECHAT_PAY_MCH_ID"),
    apiV3Key: requireWechatApiV3Key(),
    certSerialNo: requireEnv("WECHAT_PAY_CERT_SERIAL_NO"),
    privateKey: normalizePem(requireEnv("WECHAT_PAY_PRIVATE_KEY"), "PRIVATE KEY"),
    platformCertSerialNo: normalizeOptional(process.env.WECHAT_PAY_PLATFORM_CERT_SERIAL_NO),
    platformCertificate: normalizePem(requireEnv("WECHAT_PAY_PLATFORM_CERTIFICATE"), "CERTIFICATE"),
    gatewayUrl,
    notifyUrl: joinUrl(notifyBaseUrl, "/api/v1/payments/wechat/notify")
  };
}

export function getPaymentOrderExpireMinutes() {
  const value = Number(process.env.PAYMENT_ORDER_EXPIRE_MINUTES ?? DEFAULT_ORDER_EXPIRE_MINUTES);

  return Number.isFinite(value) && value > 0 ? Math.floor(value) : DEFAULT_ORDER_EXPIRE_MINUTES;
}

export function getOrderExpiresAt(createdAt: string) {
  return new Date(new Date(createdAt).getTime() + getPaymentOrderExpireMinutes() * 60 * 1000).toISOString();
}

export function isOrderExpired(createdAt: string, now = new Date()) {
  return new Date(getOrderExpiresAt(createdAt)).getTime() <= now.getTime();
}

export function isValidMaintenanceSecret(value: string | null) {
  const secret = normalizeOptional(process.env.MAINTENANCE_SECRET);

  return Boolean(secret && value && value === secret);
}

export function joinUrl(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

function requireEnv(name: string) {
  return requireConfiguredValue(normalizeOptional(process.env[name]), name);
}

function requireWechatApiV3Key() {
  const value = requireEnv("WECHAT_PAY_API_KEY");

  if (Buffer.byteLength(value, "utf8") !== 32) {
    throw new ApiError("PAYMENT_CONFIG_ERROR", "微信支付 API v3 Key 配置不正确", 500);
  }

  return value;
}

function isPaymentChannelConfigured(channel: PayChannel, config: PaymentConfig) {
  if (channel !== config.mode) {
    return false;
  }

  if (channel === "mock") {
    return config.mockEnabled && process.env.NODE_ENV !== "production";
  }

  if (channel === "alipay") {
    try {
      getAlipayConfig();
      return true;
    } catch {
      return false;
    }
  }

  try {
    getWechatPayConfig();
    return true;
  } catch {
    return false;
  }
}

function requireConfiguredValue(value: string | null, _name: string) {
  if (!value) {
    throw new ApiError("PAYMENT_CONFIG_ERROR", "支付渠道配置不完整", 500);
  }

  return value;
}

function requireHttpsUrl(value: string, _name: string) {
  try {
    const url = new URL(value);

    if (url.protocol === "https:") {
      return url.toString();
    }
  } catch {
    // Fall through to stable API error below.
  }

  throw new ApiError("PAYMENT_CONFIG_ERROR", "真实支付地址必须使用 HTTPS", 500);
}

function normalizeOptional(value: string | undefined) {
  const normalized = value?.trim();

  return normalized || null;
}

function normalizePem(value: string, label: "PRIVATE KEY" | "PUBLIC KEY" | "CERTIFICATE") {
  const normalized = value.trim().replace(/\\n/g, "\n");

  if (normalized.includes("-----BEGIN")) {
    return normalized;
  }

  const body = normalized.match(/.{1,64}/g)?.join("\n") ?? normalized;

  return `-----BEGIN ${label}-----\n${body}\n-----END ${label}-----`;
}
