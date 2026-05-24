export class ServerConfigError extends Error {}

export type DataMode = "mock" | "database";
export type PaymentMode = "mock" | "wechat" | "alipay";

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
