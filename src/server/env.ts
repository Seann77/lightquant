export class ServerConfigError extends Error {}

export type DataMode = "mock" | "database";
export type PaymentMode = "mock" | "wechat" | "alipay";
export type AiProviderMode = "mock" | "deepseek" | "zhipu" | "openai_compatible";

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

export function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new ServerConfigError("DATABASE_URL must be set when LIGHTQUANT_DATA_MODE=database");
  }

  return databaseUrl;
}

export function shouldExposeMockSmsCode() {
  return process.env.NODE_ENV !== "production" && getDataMode() === "mock";
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

export function getAiProviderMode(): AiProviderMode {
  const provider = process.env.LIGHTQUANT_AI_PROVIDER ?? (process.env.NODE_ENV === "production" ? "deepseek" : "mock");

  if (provider !== "mock" && provider !== "deepseek" && provider !== "zhipu" && provider !== "openai_compatible") {
    throw new ServerConfigError("LIGHTQUANT_AI_PROVIDER must be mock, deepseek, zhipu, or openai_compatible");
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

  if (provider === "zhipu") {
    return "https://open.bigmodel.cn/api/paas/v4";
  }

  if (provider === "mock") {
    return "mock://lightquant-ai";
  }

  throw new ServerConfigError("LIGHTQUANT_AI_BASE_URL must be set for openai_compatible");
}

export function getAiApiKey(provider: AiProviderMode = getAiProviderMode()) {
  const key =
    process.env.LIGHTQUANT_AI_API_KEY?.trim() ||
    (provider === "deepseek" ? process.env.DEEPSEEK_API_KEY?.trim() : "") ||
    (provider === "zhipu" ? process.env.ZHIPU_API_KEY?.trim() : "");

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

  if (provider === "zhipu") {
    return "glm-4-flash-250414";
  }

  if (provider === "mock") {
    return "lightquant-mock-model";
  }

  throw new ServerConfigError("LIGHTQUANT_AI_MODEL must be set for openai_compatible");
}

export function getAiTaskTimeoutMs() {
  const value = Number(process.env.AI_TASK_TIMEOUT_MS ?? "60000");

  return Number.isFinite(value) && value > 0 ? value : 60000;
}

export function getAiMaxRetries() {
  const value = Number(process.env.AI_MAX_RETRIES ?? "1");

  if (!Number.isFinite(value) || value < 0) {
    return 1;
  }

  return Math.min(3, Math.floor(value));
}

export function getFileUploadMaxBytes() {
  const value = Number(process.env.FILE_UPLOAD_MAX_BYTES ?? "262144");

  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 262144;
}

export function getFileAllowedExtensions() {
  const raw = process.env.FILE_ALLOWED_EXTENSIONS ?? ".py,.txt";
  const extensions = raw
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .map((item) => (item.startsWith(".") ? item : `.${item}`));

  return extensions.length > 0 ? extensions : [".py", ".txt"];
}

export function getAdminPhoneWhitelist() {
  const raw = process.env.ADMIN_PHONE_WHITELIST ?? "";

  return raw
    .split(",")
    .map((phone) => phone.trim())
    .filter(Boolean);
}
