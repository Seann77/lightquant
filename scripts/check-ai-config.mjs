import { existsSync, readFileSync } from "node:fs";
import { parse as parseDotenv } from "dotenv";

loadEnvFile(".env");
loadEnvFile(".env.local");

const allowedProviders = new Set(["mock", "deepseek", "openai_compatible"]);
const provider = normalize(process.env.LIGHTQUANT_AI_PROVIDER) || (process.env.NODE_ENV === "production" ? "deepseek" : "mock");
const model = normalize(process.env.LIGHTQUANT_AI_MODEL);
const baseUrl = normalize(process.env.LIGHTQUANT_AI_BASE_URL);
const nodeEnv = process.env.NODE_ENV || "development";
const isProduction = nodeEnv === "production";
const allowMockInProduction = process.env.LIGHTQUANT_ALLOW_MOCK_AI_IN_PRODUCTION === "true";
const errors = [];
const warnings = [];

if (!allowedProviders.has(provider)) {
  errors.push(`LIGHTQUANT_AI_PROVIDER must be one of: ${Array.from(allowedProviders).join(", ")}`);
}

if (provider === "mock" && isProduction && !allowMockInProduction) {
  errors.push("LIGHTQUANT_AI_PROVIDER=mock is not allowed in production unless LIGHTQUANT_ALLOW_MOCK_AI_IN_PRODUCTION=true.");
}

if (provider === "openai_compatible") {
  requireValue("LIGHTQUANT_AI_BASE_URL", baseUrl);
  requireValue("LIGHTQUANT_AI_MODEL", model);
  requireAnyKey(["LIGHTQUANT_AI_API_KEY"]);
  validateBaseUrl(baseUrl, "LIGHTQUANT_AI_BASE_URL");
}

if (provider === "deepseek") {
  requireAnyKey(["LIGHTQUANT_AI_API_KEY", "DEEPSEEK_API_KEY"]);
  if (!model) {
    warnings.push("LIGHTQUANT_AI_MODEL is not set; runtime will default to deepseek-chat.");
  }
  if (baseUrl) {
    validateBaseUrl(baseUrl, "LIGHTQUANT_AI_BASE_URL");
  }
}

if (provider === "mock") {
  if (!isProduction) {
    warnings.push("Mock AI is suitable for local development only.");
  }
}

if (hasEnv("ZHIPU_API_KEY")) {
  errors.push("ZHIPU_API_KEY is still present. Remove it to avoid accidental GLM/Zhipu configuration drift.");
}

if (provider === "zhipu") {
  errors.push("LIGHTQUANT_AI_PROVIDER=zhipu is no longer supported. Use openai_compatible for MiMo Pro.");
}

if (model.toLowerCase().startsWith("glm")) {
  errors.push("LIGHTQUANT_AI_MODEL still points to a GLM model. Use mimo-v2.5-pro for the current MiMo Pro setup.");
}

const result = {
  ok: errors.length === 0,
  envLocalExists: existsSync(".env.local"),
  nodeEnv,
  provider,
  model: model || getDefaultModel(provider),
  baseUrl: describeBaseUrl(provider, baseUrl),
  apiKey: {
    lightquantConfigured: hasEnv("LIGHTQUANT_AI_API_KEY"),
    deepseekFallbackConfigured: hasEnv("DEEPSEEK_API_KEY")
  },
  legacy: {
    zhipuApiKeyPresent: hasEnv("ZHIPU_API_KEY"),
    glmModelPresent: model.toLowerCase().startsWith("glm")
  },
  warnings,
  errors,
  nextActions: getNextActions()
};

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

function normalize(value) {
  return String(value || "").trim();
}

function hasEnv(name) {
  return Boolean(normalize(process.env[name]));
}

function requireValue(name, value) {
  if (!value) {
    errors.push(`${name} is required for ${provider}.`);
  }
}

function requireAnyKey(names) {
  if (!names.some((name) => hasEnv(name))) {
    errors.push(`One of ${names.join(", ")} must be set for ${provider}.`);
  }
}

function validateBaseUrl(value, name) {
  if (!value) {
    return;
  }

  try {
    const url = new URL(value);

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      errors.push(`${name} must use http or https.`);
    }

    if (provider !== "mock" && url.protocol !== "https:") {
      errors.push(`${name} should use HTTPS for real model providers.`);
    }
  } catch {
    errors.push(`${name} must be a valid URL.`);
  }
}

function describeBaseUrl(selectedProvider, value) {
  const resolved = value || getDefaultBaseUrl(selectedProvider);

  if (!resolved) {
    return {
      configured: false,
      usesDefault: false,
      validUrl: false
    };
  }

  try {
    const url = new URL(resolved);

    return {
      configured: Boolean(value),
      usesDefault: !value,
      validUrl: true,
      protocol: url.protocol,
      hostType: getHostType(url.hostname),
      https: url.protocol === "https:"
    };
  } catch {
    return {
      configured: Boolean(value),
      usesDefault: !value,
      validUrl: false
    };
  }
}

function getDefaultBaseUrl(selectedProvider) {
  if (selectedProvider === "deepseek") {
    return "https://api.deepseek.com";
  }

  if (selectedProvider === "mock") {
    return "mock://lightquant-ai";
  }

  return "";
}

function getDefaultModel(selectedProvider) {
  if (selectedProvider === "deepseek") {
    return "deepseek-chat";
  }

  if (selectedProvider === "mock") {
    return "lightquant-mock-model";
  }

  return "(missing)";
}

function getHostType(hostname) {
  if (hostname.includes("xiaomimimo.com")) {
    return "xiaomi-mimo";
  }

  if (hostname.includes("deepseek.com")) {
    return "deepseek";
  }

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "local";
  }

  return "other";
}

function getNextActions() {
  if (errors.length === 0) {
    if (provider === "openai_compatible" && describeBaseUrl(provider, baseUrl).hostType === "xiaomi-mimo") {
      return ["AI configuration is ready for MiMo Pro compatible calls."];
    }

    if (provider === "mock") {
      return ["Mock AI configuration is usable for local development only."];
    }

    return ["AI configuration shape is complete. Run an AI smoke test to verify the provider response."];
  }

  const actions = ["Update .env.local or deployment environment variables, then run npm run check:ai again."];

  if (errors.some((item) => item.includes("GLM") || item.includes("ZHIPU") || item.includes("zhipu"))) {
    actions.push("Use LIGHTQUANT_AI_PROVIDER=openai_compatible and LIGHTQUANT_AI_MODEL=mimo-v2.5-pro for the current MiMo setup.");
  }

  return actions;
}
