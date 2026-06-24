import type { AiModelProfile } from "@/server/domain";
import {
  getAiApiKey,
  getAiBaseUrl,
  getAiModelName,
  getAiProviderMode,
  getAiSupportsVision,
  ServerConfigError,
  type AiProviderMode
} from "@/server/env";
import { getRepository } from "@/server/repositories";

export const ALLOWED_AI_API_KEY_ENV_NAMES = ["LIGHTQUANT_AI_API_KEY", "DEEPSEEK_API_KEY"] as const;

export type AllowedAiApiKeyEnvName = (typeof ALLOWED_AI_API_KEY_ENV_NAMES)[number];

export type AiRuntimeConfig = {
  provider: AiProviderMode;
  baseUrl: string;
  apiKey: string;
  model: string;
  supportsVision: boolean;
  source: "env" | "database override";
  activeProfileId: string | null;
  activeProfileName: string | null;
  apiKeyEnvName: AllowedAiApiKeyEnvName | null;
};

export type AiRuntimeConfigSummary = {
  provider: AiProviderMode | "invalid";
  baseUrlHost: string;
  model: string;
  supportsVision: boolean;
  apiKeyConfigured: boolean;
  apiKeyEnvName: AllowedAiApiKeyEnvName | null;
  source: "env" | "database override";
  activeProfileId: string | null;
  activeProfileName: string | null;
  configValid: boolean;
  errorHint: string | null;
};

export async function resolveAiRuntimeConfig(): Promise<AiRuntimeConfig> {
  const activeProfile = await getRepository().getActiveAiModelProfile();

  if (activeProfile) {
    return resolveProfileRuntimeConfig(activeProfile);
  }

  return resolveEnvRuntimeConfig();
}

export function summarizeAiRuntimeConfig(activeProfile: AiModelProfile | null): AiRuntimeConfigSummary {
  if (activeProfile) {
    return summarizeProfileRuntimeConfig(activeProfile);
  }

  return summarizeEnvRuntimeConfig();
}

export function sanitizeBaseUrlForAdmin(baseUrl: string) {
  if (!baseUrl.trim()) {
    return "-";
  }

  try {
    const parsed = new URL(baseUrl);

    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return "invalid";
  }
}

export function validateAiModelProfileForRuntime(profile: AiModelProfile) {
  resolveProfileRuntimeConfig(profile);
}

export function isAllowedAiApiKeyEnvName(value: string | null | undefined): value is AllowedAiApiKeyEnvName {
  return ALLOWED_AI_API_KEY_ENV_NAMES.includes(value as AllowedAiApiKeyEnvName);
}

export function isAiProviderMode(value: string): value is AiProviderMode {
  return value === "mock" || value === "deepseek" || value === "openai_compatible";
}

function resolveProfileRuntimeConfig(profile: AiModelProfile): AiRuntimeConfig {
  if (!profile.enabled) {
    throw new ServerConfigError("Active AI model profile is disabled");
  }

  if (!isAiProviderMode(profile.provider)) {
    throw new ServerConfigError("Active AI model profile provider is invalid");
  }

  const baseUrl = profile.baseUrl.trim();
  const model = profile.model.trim();

  if (!baseUrl) {
    throw new ServerConfigError("Active AI model profile baseUrl is required");
  }

  if (!model) {
    throw new ServerConfigError("Active AI model profile model is required");
  }

  if (sanitizeBaseUrlForAdmin(baseUrl) === "invalid") {
    throw new ServerConfigError("Active AI model profile baseUrl is invalid");
  }

  if (profile.provider === "mock") {
    return {
      provider: profile.provider,
      baseUrl,
      apiKey: "",
      model,
      supportsVision: profile.supportsVision,
      source: "database override",
      activeProfileId: profile.id,
      activeProfileName: profile.name,
      apiKeyEnvName: null
    };
  }

  if (!isAllowedAiApiKeyEnvName(profile.apiKeyEnvName)) {
    throw new ServerConfigError("Active AI model profile apiKeyEnvName is not allowed");
  }

  const apiKey = process.env[profile.apiKeyEnvName]?.trim();

  if (!apiKey) {
    throw new ServerConfigError(`${profile.apiKeyEnvName} must be configured for active AI model profile`);
  }

  return {
    provider: profile.provider,
    baseUrl,
    apiKey,
    model,
    supportsVision: profile.supportsVision,
    source: "database override",
    activeProfileId: profile.id,
    activeProfileName: profile.name,
    apiKeyEnvName: profile.apiKeyEnvName
  };
}

function resolveEnvRuntimeConfig(): AiRuntimeConfig {
  const provider = getAiProviderMode();
  const apiKeyEnvName = provider === "mock" ? null : getEnvApiKeyName(provider);

  return {
    provider,
    baseUrl: getAiBaseUrl(provider),
    apiKey: provider === "mock" ? "" : getAiApiKey(provider),
    model: getAiModelName(provider),
    supportsVision: getAiSupportsVision(provider),
    source: "env",
    activeProfileId: null,
    activeProfileName: null,
    apiKeyEnvName
  };
}

function summarizeProfileRuntimeConfig(profile: AiModelProfile): AiRuntimeConfigSummary {
  try {
    const config = resolveProfileRuntimeConfig(profile);

    return {
      provider: config.provider,
      baseUrlHost: sanitizeBaseUrlForAdmin(config.baseUrl),
      model: config.model,
      supportsVision: config.supportsVision,
      apiKeyConfigured: Boolean(config.apiKey),
      apiKeyEnvName: config.apiKeyEnvName,
      source: config.source,
      activeProfileId: config.activeProfileId,
      activeProfileName: config.activeProfileName,
      configValid: true,
      errorHint: null
    };
  } catch (error) {
    return {
      provider: isAiProviderMode(profile.provider) ? profile.provider : "invalid",
      baseUrlHost: sanitizeBaseUrlForAdmin(profile.baseUrl),
      model: profile.model || "-",
      supportsVision: profile.supportsVision,
      apiKeyConfigured: Boolean(profile.apiKeyEnvName && process.env[profile.apiKeyEnvName]?.trim()),
      apiKeyEnvName: isAllowedAiApiKeyEnvName(profile.apiKeyEnvName) ? profile.apiKeyEnvName : null,
      source: "database override",
      activeProfileId: profile.id,
      activeProfileName: profile.name,
      configValid: false,
      errorHint: error instanceof Error ? error.message : "Active AI model profile is invalid"
    };
  }
}

function summarizeEnvRuntimeConfig(): AiRuntimeConfigSummary {
  try {
    const config = resolveEnvRuntimeConfig();

    return {
      provider: config.provider,
      baseUrlHost: sanitizeBaseUrlForAdmin(config.baseUrl),
      model: config.model,
      supportsVision: config.supportsVision,
      apiKeyConfigured: Boolean(config.apiKey),
      apiKeyEnvName: config.apiKeyEnvName,
      source: config.source,
      activeProfileId: null,
      activeProfileName: null,
      configValid: true,
      errorHint: null
    };
  } catch (error) {
    const provider = safeReadEnvProvider();

    return {
      provider,
      baseUrlHost: safeReadEnvBaseUrlHost(provider),
      model: safeReadEnvModel(provider),
      supportsVision: safeReadEnvSupportsVision(provider),
      apiKeyConfigured: hasEnvApiKey(provider),
      apiKeyEnvName: provider === "mock" || provider === "invalid" ? null : getEnvApiKeyName(provider),
      source: "env",
      activeProfileId: null,
      activeProfileName: null,
      configValid: false,
      errorHint: error instanceof Error ? error.message : "AI env config is invalid"
    };
  }
}

function getEnvApiKeyName(provider: Exclude<AiProviderMode, "mock">): AllowedAiApiKeyEnvName {
  if (provider === "deepseek" && !process.env.LIGHTQUANT_AI_API_KEY?.trim() && process.env.DEEPSEEK_API_KEY?.trim()) {
    return "DEEPSEEK_API_KEY";
  }

  return "LIGHTQUANT_AI_API_KEY";
}

function hasEnvApiKey(provider: AiProviderMode | "invalid") {
  if (provider === "mock") {
    return false;
  }

  if (provider === "deepseek") {
    return Boolean(process.env.LIGHTQUANT_AI_API_KEY?.trim() || process.env.DEEPSEEK_API_KEY?.trim());
  }

  if (provider === "openai_compatible") {
    return Boolean(process.env.LIGHTQUANT_AI_API_KEY?.trim());
  }

  return false;
}

function safeReadEnvProvider(): AiProviderMode | "invalid" {
  try {
    return getAiProviderMode();
  } catch {
    return "invalid";
  }
}

function safeReadEnvBaseUrlHost(provider: AiProviderMode | "invalid") {
  try {
    return provider === "invalid" ? "-" : sanitizeBaseUrlForAdmin(getAiBaseUrl(provider));
  } catch {
    return "-";
  }
}

function safeReadEnvModel(provider: AiProviderMode | "invalid") {
  try {
    return provider === "invalid" ? "-" : getAiModelName(provider);
  } catch {
    return "-";
  }
}

function safeReadEnvSupportsVision(provider: AiProviderMode | "invalid") {
  try {
    return provider !== "invalid" && getAiSupportsVision(provider);
  } catch {
    return false;
  }
}
