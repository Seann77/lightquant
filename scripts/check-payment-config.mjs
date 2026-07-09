import { existsSync, readFileSync } from "node:fs";
import { parse as parseDotenv } from "dotenv";

loadEnvFile(".env");
loadEnvFile(".env.local");

const nodeEnv = process.env.NODE_ENV || "development";
const isProduction = nodeEnv === "production";
const allowedModes = new Set(["mock", "alipay", "wechat"]);
const errors = [];
const warnings = [];
const mode = getRequestedMode();
const featureEnabled = readBoolean("PAYMENT_FEATURE_ENABLED", !isProduction);
const mockEnabled = process.env.PAYMENT_MOCK_ENABLED !== "false";

if (!allowedModes.has(mode)) {
  errors.push(`LIGHTQUANT_PAYMENT_MODE must be one of: ${Array.from(allowedModes).join(", ")}`);
}

if (isProduction && mode === "mock") {
  errors.push("Mock payment mode is not allowed when NODE_ENV=production.");
}

if (isProduction && mockEnabled) {
  errors.push("PAYMENT_MOCK_ENABLED must be false when NODE_ENV=production.");
}

const result = {
  ok: false,
  envLocalExists: existsSync(".env.local"),
  mode,
  nodeEnv,
  production: isProduction,
  featureEnabled,
  mockEnabled,
  orderExpireMinutes: readPositiveInteger("PAYMENT_ORDER_EXPIRE_MINUTES", 5),
  notifyBaseUrl: describeUrl("PAYMENT_NOTIFY_BASE_URL"),
  returnBaseUrl: describeUrl("PAYMENT_RETURN_BASE_URL"),
  gatewayUrl: describeGateway(mode),
  maintenanceSecretConfigured: hasEnv("MAINTENANCE_SECRET"),
  required: {
    present: [],
    missing: []
  },
  warnings,
  errors,
  nextActions: []
};

if (!featureEnabled) {
  warnings.push("PAYMENT_FEATURE_ENABLED is false; recharge entry points and order creation should remain hidden until the feature is opened.");
} else if (mode === "mock") {
  if (!mockEnabled) {
    errors.push("PAYMENT_MOCK_ENABLED is false, so mock payment cannot be used.");
  }
} else if (mode === "alipay") {
  requireNames(["ALIPAY_APP_ID", "ALIPAY_PRIVATE_KEY", "ALIPAY_PUBLIC_KEY", "PAYMENT_NOTIFY_BASE_URL"]);
  warnIfMissing("PAYMENT_RETURN_BASE_URL", "PAYMENT_RETURN_BASE_URL is not set; runtime will fall back to PAYMENT_NOTIFY_BASE_URL.");
  validateRealPaymentUrls();
  warnIfPemWillBeWrapped("ALIPAY_PRIVATE_KEY");
  warnIfPemWillBeWrapped("ALIPAY_PUBLIC_KEY");
} else if (mode === "wechat") {
  requireNames([
    "WECHAT_PAY_APP_ID",
    "WECHAT_PAY_MCH_ID",
    "WECHAT_PAY_API_KEY",
    "WECHAT_PAY_CERT_SERIAL_NO",
    "WECHAT_PAY_PRIVATE_KEY",
    "WECHAT_PAY_PLATFORM_CERTIFICATE",
    "PAYMENT_NOTIFY_BASE_URL"
  ]);
  warnIfMissing(
    "WECHAT_PAY_PLATFORM_CERT_SERIAL_NO",
    "WECHAT_PAY_PLATFORM_CERT_SERIAL_NO is not set; notify verification will rely on the provided platform certificate only."
  );
  validateRealPaymentUrls();
  validateWechatApiV3Key();
  warnIfPemWillBeWrapped("WECHAT_PAY_PRIVATE_KEY");
  warnIfPemWillBeWrapped("WECHAT_PAY_PLATFORM_CERTIFICATE");
}

if (!hasEnv("MAINTENANCE_SECRET")) {
  warnings.push("MAINTENANCE_SECRET is not set; close-expired maintenance can still be run by admins, but cron-style calls need this secret.");
}

result.ok = errors.length === 0;
result.nextActions = getNextActions();

console.log(JSON.stringify(result, null, 2));

if (!result.ok) {
  process.exitCode = 1;
}

function loadEnvFile(path) {
  if (!existsSync(path)) {
    return;
  }

  Object.assign(process.env, parseDotenv(readFileSync(path)));
}

function getRequestedMode() {
  const cliMode = getCliValue("--mode");
  const envOverride = normalize(process.env.PAYMENT_CONFIG_CHECK_MODE);

  return cliMode || envOverride || normalize(process.env.LIGHTQUANT_PAYMENT_MODE) || (isProduction ? "wechat" : "mock");
}

function getCliValue(name) {
  const prefix = `${name}=`;
  const inline = process.argv.find((arg) => arg.startsWith(prefix));

  if (inline) {
    return normalize(inline.slice(prefix.length));
  }

  const index = process.argv.indexOf(name);
  if (index >= 0) {
    return normalize(process.argv[index + 1]);
  }

  return "";
}

function requireNames(names) {
  for (const name of names) {
    if (hasEnv(name)) {
      result.required.present.push(name);
    } else {
      result.required.missing.push(name);
      errors.push(`${name} is required for ${mode} payment.`);
    }
  }
}

function warnIfMissing(name, message) {
  if (!hasEnv(name)) {
    warnings.push(message);
  }
}

function validateRealPaymentUrls() {
  const notify = describeUrl("PAYMENT_NOTIFY_BASE_URL");

  if (!notify.configured) {
    return;
  }

  if (!notify.validUrl) {
    errors.push("PAYMENT_NOTIFY_BASE_URL must be a valid URL.");
    return;
  }

  if (!notify.https) {
    errors.push("PAYMENT_NOTIFY_BASE_URL must use HTTPS for real payment notify callbacks.");
  }

  const returnBase = describeUrl("PAYMENT_RETURN_BASE_URL");
  if (returnBase.configured && !returnBase.validUrl) {
    errors.push("PAYMENT_RETURN_BASE_URL must be a valid URL when configured.");
  }

  if (returnBase.configured && returnBase.validUrl && !returnBase.https) {
    errors.push("PAYMENT_RETURN_BASE_URL must use HTTPS when configured for real payment returns.");
  }

  validateReturnBaseMatchesSiteOrigin(returnBase);

  const gateway = describeGateway(mode);
  if (gateway.configured && !gateway.validUrl) {
    errors.push(`${mode === "alipay" ? "ALIPAY_GATEWAY_URL" : "WECHAT_PAY_GATEWAY_URL"} must be a valid URL when configured.`);
  }

  if (gateway.validUrl && !gateway.https) {
    errors.push(`${mode === "alipay" ? "ALIPAY_GATEWAY_URL" : "WECHAT_PAY_GATEWAY_URL"} must use HTTPS for real payment provider requests.`);
  }
}

function validateReturnBaseMatchesSiteOrigin(returnBase) {
  const site = describeUrl("NEXT_PUBLIC_SITE_URL");

  if (!returnBase.configured || !returnBase.validUrl || !site.configured || !site.validUrl) {
    return;
  }

  if (returnBase.origin !== site.origin) {
    errors.push(
      `PAYMENT_RETURN_BASE_URL origin must match NEXT_PUBLIC_SITE_URL origin so login cookies survive Alipay return. return=${returnBase.origin}, site=${site.origin}`
    );
  }
}

function describeGateway(selectedMode) {
  if (selectedMode === "alipay") {
    return describeUrl("ALIPAY_GATEWAY_URL", "https://openapi.alipay.com/gateway.do");
  }

  if (selectedMode === "wechat") {
    return describeUrl("WECHAT_PAY_GATEWAY_URL", "https://api.mch.weixin.qq.com");
  }

  return { configured: false, usesDefault: false };
}

function describeUrl(name, fallback = "") {
  const raw = normalize(process.env[name]);
  const value = raw || fallback;

  if (!value) {
    return {
      configured: false,
      usesDefault: Boolean(fallback),
      validUrl: false,
      https: false
    };
  }

  try {
    const url = new URL(value);

    return {
      configured: Boolean(raw),
      usesDefault: !raw && Boolean(fallback),
      validUrl: true,
      protocol: url.protocol,
      origin: url.origin,
      hostType: getHostType(url.hostname),
      https: url.protocol === "https:"
    };
  } catch {
    return {
      configured: Boolean(raw),
      usesDefault: !raw && Boolean(fallback),
      validUrl: false,
      https: false
    };
  }
}

function getHostType(hostname) {
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

function warnIfPemWillBeWrapped(name) {
  const value = normalize(process.env[name]);

  if (value && !value.includes("-----BEGIN")) {
    warnings.push(`${name} does not include a PEM header; runtime will wrap it before use.`);
  }
}

function validateWechatApiV3Key() {
  const value = normalize(process.env.WECHAT_PAY_API_KEY);

  if (value && Buffer.byteLength(value, "utf8") !== 32) {
    errors.push("WECHAT_PAY_API_KEY must be 32 bytes for WeChat Pay API v3.");
  }
}

function readPositiveInteger(name, fallback) {
  const value = Number(process.env[name] || fallback);

  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}

function readBoolean(name, fallback) {
  const value = normalize(process.env[name]).toLowerCase();

  if (!value) {
    return fallback;
  }

  if (["true", "1", "yes", "on"].includes(value)) {
    return true;
  }

  if (["false", "0", "no", "off"].includes(value)) {
    return false;
  }

  warnings.push(`${name} should be true or false; using ${fallback ? "true" : "false"} for this check.`);
  return fallback;
}

function hasEnv(name) {
  return Boolean(normalize(process.env[name]));
}

function normalize(value) {
  return String(value || "").trim();
}

function getNextActions() {
  if (errors.length === 0) {
    if (!featureEnabled) {
      return ["Payment feature is hidden. Set PAYMENT_FEATURE_ENABLED=true and complete provider credentials before opening recharge on 2026-06-28."];
    }

    if (mode === "mock") {
      return ["Mock payment configuration is usable for local development only."];
    }

    return ["Payment configuration shape is complete. Use provider sandbox/live callbacks to verify signing and notify handling."];
  }

  const actions = ["Set the missing variables in .env.local or deployment environment variables."];

  if (mode !== "mock") {
    actions.push("Use an HTTPS public PAYMENT_NOTIFY_BASE_URL before testing real payment callbacks.");
  }

  actions.push("Run npm run check:payment again after updating configuration.");
  return actions;
}
