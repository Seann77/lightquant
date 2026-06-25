export class ServerConfigError extends Error {}

export type DataMode = "mock" | "database";
export type PaymentMode = "mock" | "wechat" | "alipay";
export type AiProviderMode = "mock" | "deepseek" | "openai_compatible";
export type SmsProviderMode = "mock" | "aliyun" | "tencent";

export function getDataMode(): DataMode {
  const mode = process.env.LIGHTQUANT_DATA_MODE ?? (process.env.NODE_ENV === "production" ? "database" : "mock");

  if (mode !== "mock" && mode !== "database") {
    throw new ServerConfigError("LIGHTQUANT_DATA_MODE must be mock or database");
  }

  if (process.env.NODE_ENV === "production" && mode === "mock") {
    throw new ServerConfigError("LIGHTQUANT_DATA_MODE=mock is not allowed in production");
  }

  return mode;
}

export function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret || secret.length < 32) {
    throw new ServerConfigError("AUTH_SECRET must be set to at least 32 characters");
  }

  return secret;
}

export function getBetaVipConfig() {
  return {
    enabled: getBoolean(process.env.BETA_VIP_ENABLED, true),
    registrationDeadline: getIsoDateString(
      process.env.BETA_VIP_REGISTRATION_DEADLINE,
      "BETA_VIP_REGISTRATION_DEADLINE",
      "2026-06-28T15:59:59.999Z"
    ),
    dailyTaskLimit: getPositiveInteger(process.env.BETA_VIP_DAILY_TASK_LIMIT, 200),
    minuteTaskLimit: getPositiveInteger(process.env.BETA_VIP_MINUTE_TASK_LIMIT, 5),
    concurrentTaskLimit: getPositiveInteger(process.env.BETA_VIP_CONCURRENT_TASK_LIMIT, 2)
  };
}

export function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new ServerConfigError("DATABASE_URL must be set when LIGHTQUANT_DATA_MODE=database");
  }

  return databaseUrl;
}

export function getSmsProviderMode(): SmsProviderMode {
  const explicitMode = process.env.LIGHTQUANT_SMS_PROVIDER?.trim();
  const mode = explicitMode || (hasAliyunSmsCredentials() ? "aliyun" : "mock");

  if (mode !== "mock" && mode !== "aliyun" && mode !== "tencent") {
    throw new ServerConfigError("LIGHTQUANT_SMS_PROVIDER must be mock, aliyun, or tencent");
  }

  if (process.env.NODE_ENV === "production" && mode === "mock" && process.env.LIGHTQUANT_ALLOW_MOCK_SMS_IN_PRODUCTION !== "true") {
    throw new ServerConfigError("LIGHTQUANT_SMS_PROVIDER=mock is not allowed in production");
  }

  return mode;
}

export function shouldExposeMockSmsCode() {
  return process.env.NODE_ENV !== "production" && getSmsProviderMode() === "mock";
}

export function getAliyunSmsConfig() {
  const accessKeyId = process.env.ALIBABA_CLOUD_ACCESS_KEY_ID?.trim();
  const accessKeySecret = process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET?.trim();
  const signName = process.env.ALIYUN_DYPNS_SIGN_NAME?.trim();
  const templateCode = process.env.ALIYUN_DYPNS_TEMPLATE_CODE?.trim();

  if (!accessKeyId || !accessKeySecret || !signName || !templateCode) {
    throw new ServerConfigError("Aliyun SMS requires ALIBABA_CLOUD_ACCESS_KEY_ID, ALIBABA_CLOUD_ACCESS_KEY_SECRET, ALIYUN_DYPNS_SIGN_NAME, and ALIYUN_DYPNS_TEMPLATE_CODE");
  }

  return {
    accessKeyId,
    accessKeySecret,
    signName,
    templateCode,
    endpoint: process.env.ALIYUN_DYPNS_ENDPOINT?.trim() || "dypnsapi.aliyuncs.com",
    countryCode: process.env.ALIYUN_DYPNS_COUNTRY_CODE?.trim() || "86",
    validTimeSeconds: getPositiveInteger(process.env.ALIYUN_DYPNS_VALID_TIME, 300),
    intervalSeconds: getPositiveInteger(process.env.ALIYUN_DYPNS_INTERVAL, 60),
    codeLength: getBoundedInteger(process.env.ALIYUN_DYPNS_CODE_LENGTH, 6, 4, 8)
  };
}

export function getTencentSmsConfig() {
  const secretId = process.env.TENCENTCLOUD_SECRET_ID?.trim();
  const secretKey = process.env.TENCENTCLOUD_SECRET_KEY?.trim();
  const smsSdkAppId = process.env.TENCENT_SMS_SDK_APP_ID?.trim();
  const signName = process.env.TENCENT_SMS_SIGN_NAME?.trim();
  const templateId = process.env.TENCENT_SMS_TEMPLATE_ID?.trim();

  if (!secretId || !secretKey || !smsSdkAppId || !signName || !templateId) {
    throw new ServerConfigError("Tencent SMS requires TENCENTCLOUD_SECRET_ID, TENCENTCLOUD_SECRET_KEY, TENCENT_SMS_SDK_APP_ID, TENCENT_SMS_SIGN_NAME, and TENCENT_SMS_TEMPLATE_ID");
  }

  return {
    secretId,
    secretKey,
    smsSdkAppId,
    signName,
    templateId,
    region: process.env.TENCENT_SMS_REGION?.trim() || "ap-guangzhou",
    endpoint: process.env.TENCENT_SMS_ENDPOINT?.trim() || "sms.tencentcloudapi.com",
    countryCode: process.env.TENCENT_SMS_COUNTRY_CODE?.trim() || "86",
    validTimeSeconds: getPositiveInteger(process.env.TENCENT_SMS_VALID_TIME, 300),
    codeLength: getBoundedInteger(process.env.TENCENT_SMS_CODE_LENGTH, 6, 4, 8),
    templateParamKeys: getTencentTemplateParamKeys()
  };
}

function hasAliyunSmsCredentials() {
  return Boolean(process.env.ALIBABA_CLOUD_ACCESS_KEY_ID?.trim() && process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET?.trim());
}

function getTencentTemplateParamKeys() {
  const keys = (process.env.TENCENT_SMS_TEMPLATE_PARAM_KEYS || "code,minutes")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return keys.length > 0 ? keys : ["code", "minutes"];
}

function getPositiveInteger(raw: string | undefined, fallback: number) {
  const value = Number(raw);

  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}

function getBoundedInteger(raw: string | undefined, fallback: number, min: number, max: number) {
  const value = getPositiveInteger(raw, fallback);

  return Math.min(max, Math.max(min, value));
}

function getBoolean(raw: string | undefined, fallback: boolean) {
  const normalized = raw?.trim().toLowerCase();

  if (!normalized) {
    return fallback;
  }

  if (["true", "1", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["false", "0", "no", "off"].includes(normalized)) {
    return false;
  }

  return fallback;
}

function isExplicitlyEnabled(raw: string | undefined) {
  return raw?.trim().toLowerCase() === "true";
}

function getIsoDateString(raw: string | undefined, name: string, fallback: string) {
  const value = raw?.trim() || fallback;
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new ServerConfigError(`${name} must be a valid ISO datetime`);
  }

  return parsed.toISOString();
}

export function getPaymentMode(): PaymentMode {
  const mode = process.env.LIGHTQUANT_PAYMENT_MODE ?? (process.env.NODE_ENV === "production" ? "wechat" : "mock");

  if (mode !== "mock" && mode !== "wechat" && mode !== "alipay") {
    throw new ServerConfigError("LIGHTQUANT_PAYMENT_MODE must be mock, wechat, or alipay");
  }

  if (process.env.NODE_ENV === "production" && mode === "mock") {
    throw new ServerConfigError("LIGHTQUANT_PAYMENT_MODE=mock is not allowed in production");
  }

  return mode;
}

export function isMockPaymentEnabled() {
  return process.env.PAYMENT_MOCK_ENABLED !== "false";
}

export function isPaymentFeatureEnabled() {
  return getBoolean(process.env.PAYMENT_FEATURE_ENABLED, process.env.NODE_ENV !== "production");
}

export function isAdminWriteEnabled() {
  return isExplicitlyEnabled(process.env.ADMIN_WRITE_ENABLED);
}

export function isAdminModelConfigWriteEnabled() {
  return isAdminWriteEnabled() && isExplicitlyEnabled(process.env.ADMIN_MODEL_CONFIG_WRITE_ENABLED);
}

export function getAiProviderMode(): AiProviderMode {
  const provider = process.env.LIGHTQUANT_AI_PROVIDER ?? (process.env.NODE_ENV === "production" ? "deepseek" : "mock");

  if (provider !== "mock" && provider !== "deepseek" && provider !== "openai_compatible") {
    throw new ServerConfigError("LIGHTQUANT_AI_PROVIDER must be mock, deepseek, or openai_compatible");
  }

  if (process.env.NODE_ENV === "production" && provider === "mock" && process.env.LIGHTQUANT_ALLOW_MOCK_AI_IN_PRODUCTION !== "true") {
    throw new ServerConfigError("LIGHTQUANT_AI_PROVIDER=mock is not allowed in production");
  }

  return provider;
}

export function getAiBaseUrl(provider: AiProviderMode = getAiProviderMode()) {
  const explicitBaseUrl = process.env.LIGHTQUANT_AI_BASE_URL?.trim();

  if (explicitBaseUrl) {
    return explicitBaseUrl;
  }

  if (provider === "deepseek") {
    return "https://api.deepseek.com";
  }

  if (provider === "mock") {
    return "mock://lightquant-ai";
  }

  throw new ServerConfigError("LIGHTQUANT_AI_BASE_URL must be set for openai_compatible");
}

export function getAiApiKey(provider: AiProviderMode = getAiProviderMode()) {
  const key =
    process.env.LIGHTQUANT_AI_API_KEY?.trim() ||
    (provider === "deepseek" ? process.env.DEEPSEEK_API_KEY?.trim() : "");

  if (!key) {
    throw new ServerConfigError("LIGHTQUANT_AI_API_KEY must be set");
  }

  return key;
}

export function getAiModelName(provider: AiProviderMode = getAiProviderMode()) {
  const model = process.env.LIGHTQUANT_AI_MODEL?.trim();

  if (model) {
    return model;
  }

  if (provider === "deepseek") {
    return "deepseek-chat";
  }

  if (provider === "mock") {
    return "lightquant-mock-model";
  }

  throw new ServerConfigError("LIGHTQUANT_AI_MODEL must be set for the selected AI provider");
}

export function getAiTaskTimeoutMs() {
  const value = Number(process.env.AI_TASK_TIMEOUT_MS ?? "300000");

  return Number.isFinite(value) && value > 0 ? value : 300000;
}

export function getAiMaxRetries() {
  const value = Number(process.env.AI_MAX_RETRIES ?? "1");

  if (!Number.isFinite(value) || value < 0) {
    return 1;
  }

  return Math.min(3, Math.floor(value));
}

export function getAiSupportsVision(provider: AiProviderMode = getAiProviderMode()) {
  const raw = process.env.LIGHTQUANT_AI_SUPPORTS_VISION?.trim().toLowerCase();

  if (raw === "true" || raw === "1" || raw === "yes") {
    return true;
  }

  if (raw === "false" || raw === "0" || raw === "no") {
    return false;
  }

  if (provider === "mock") {
    return true;
  }

  if (provider === "deepseek") {
    return false;
  }

  return looksLikeVisionModel(getAiModelName(provider));
}

export function getFileUploadMaxBytes() {
  const value = Number(process.env.FILE_UPLOAD_MAX_BYTES ?? "1048576");

  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 1048576;
}

export function getImageUploadMaxBytes() {
  const value = Number(process.env.FILE_IMAGE_UPLOAD_MAX_BYTES ?? "8388608");

  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 8388608;
}

export function getFileStorageRoot() {
  return process.env.FILE_STORAGE_ROOT?.trim() || ".lightquant/uploads";
}

export function getFileAllowedExtensions() {
  const raw = process.env.FILE_ALLOWED_EXTENSIONS ?? ".py,.txt,.log,.png,.jpg";
  const extensions = raw
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .map((item) => (item.startsWith(".") ? item : `.${item}`));

  return extensions.length > 0 ? extensions : [".py", ".txt", ".log", ".png", ".jpg"];
}

export function getAdminPhoneWhitelist() {
  const raw = process.env.ADMIN_PHONE_WHITELIST ?? "";

  return raw
    .split(",")
    .map((phone) => phone.trim())
    .filter(Boolean);
}

function looksLikeVisionModel(model: string) {
  const normalized = model.toLowerCase();

  return [
    "vision",
    "vl",
    "gpt-4o",
    "gpt-4.1",
    "gemini",
    "qwen-vl",
    "glm-4v",
    "claude-3",
    "claude-4"
  ].some((keyword) => normalized.includes(keyword));
}
