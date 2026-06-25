import { requireAdmin } from "@/server/admin/admin-auth";
import {
  isAdminModelConfigWriteEnabled,
  isAdminWriteEnabled,
  ServerConfigError
} from "@/server/env";
import { ApiError } from "@/server/http/api-response";
import {
  isAiProviderMode,
  isAllowedAiApiKeyEnvName,
  isValidAiBaseUrl,
  sanitizeBaseUrlForAdmin,
  summarizeAiRuntimeConfig,
  validateAiModelProfileForRuntime,
  type AllowedAiApiKeyEnvName
} from "@/server/ai/ai-runtime-config";
import type { AiModelProfile, AiModelProvider, AiModelSecret } from "@/server/domain";
import { getRepository, withRepositoryTransaction } from "@/server/repositories";
import { encryptConfigSecret, isConfigEncryptionConfigured } from "@/server/security/config-encryption";

type SecretFormatValid = boolean | "unknown";

export type AdminModelConfigResponse = {
  current: Awaited<ReturnType<typeof summarizeAiRuntimeConfig>>;
  profiles: AdminAiModelProfileSummary[];
  secrets: AdminAiModelSecretSummary[];
  keyStatuses: AdminSecretStatus[];
  writeGuards: {
    adminWriteEnabled: boolean;
    modelConfigWriteEnabled: boolean;
    configEncryptionConfigured: boolean;
  };
};

export type AdminAiModelProfileSummary = {
  id: string;
  name: string;
  provider: AiModelProfile["provider"];
  baseUrl: string;
  baseUrlHost: string;
  model: string;
  supportsVision: boolean;
  apiKeyEnvName: AllowedAiApiKeyEnvName | null;
  apiKeySecretId: string | null;
  apiKeySource: "none" | "env" | "database secret";
  apiKeyConfigured: boolean;
  enabled: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminAiModelSecretSummary = {
  id: string;
  name: string;
  provider: AiModelProvider | null;
  configured: true;
  createdAt: string;
  updatedAt: string;
};

export type AdminSecretStatus = {
  name: string;
  configured: boolean;
  formatValid: SecretFormatValid;
  source: "env";
  hint: string;
};

export async function getAdminModelConfig(): Promise<AdminModelConfigResponse> {
  await requireAdmin();

  const repository = getRepository();
  const [profiles, activeProfile, secrets] = await Promise.all([
    repository.listAiModelProfiles(),
    repository.getActiveAiModelProfile(),
    repository.listAiModelSecrets()
  ]);
  const configuredSecretIds = new Set(secrets.map((secret) => secret.id));

  return {
    current: await summarizeAiRuntimeConfig(activeProfile),
    profiles: profiles.map((profile) => toAdminAiModelProfileSummary(profile, activeProfile?.id ?? null, configuredSecretIds)),
    secrets: secrets.map(toAdminAiModelSecretSummary),
    keyStatuses: getAdminSecretStatuses(),
    writeGuards: {
      adminWriteEnabled: isAdminWriteEnabled(),
      modelConfigWriteEnabled: isAdminModelConfigWriteEnabled(),
      configEncryptionConfigured: isConfigEncryptionConfigured()
    }
  };
}

export async function createAdminAiModelProfile(input: {
  name: string;
  provider: string;
  baseUrl: string;
  model: string;
  supportsVision: boolean;
  apiKeyEnvName?: string;
  apiKeySecretId?: string;
  enabled: boolean;
  requestId: string;
  requestIp: string | null;
}) {
  const admin = await requireModelConfigWrite();
  const now = new Date().toISOString();
  const normalized = await normalizeProfileInput(input, now);

  return withRepositoryTransaction(async () => {
    const repository = getRepository();
    const profile = await repository.createAiModelProfile({
      ...normalized,
      createdAt: now,
      updatedAt: now
    });

    await repository.createAdminAuditLog({
      adminUserId: admin.user.id,
      adminPhone: admin.user.phone,
      action: "ai_model.profile.create",
      targetType: "ai_model_profile",
      targetId: profile.id,
      summary: `Create AI model profile ${profile.provider}/${profile.model}`,
      metadata: safeProfileMetadata(profile),
      requestId: input.requestId,
      requestIp: input.requestIp,
      createdAt: now
    });

    return {
      profile: toAdminAiModelProfileSummary(profile, null, new Set([profile.apiKeySecretId].filter(Boolean) as string[]))
    };
  });
}

export async function updateAdminAiModelProfile(input: {
  profileId: string;
  name: string;
  provider: string;
  baseUrl: string;
  model: string;
  supportsVision: boolean;
  apiKeyEnvName?: string;
  apiKeySecretId?: string;
  enabled: boolean;
  requestId: string;
  requestIp: string | null;
}) {
  const admin = await requireModelConfigWrite();
  const now = new Date().toISOString();
  const profileId = normalizeId(input.profileId, "profileId");
  const existing = await getRepository().findAiModelProfileById(profileId);

  if (!existing) {
    throw new ApiError("NOT_FOUND", "模型配置不存在", 404);
  }

  const normalized = await normalizeProfileInput(input, now);

  return withRepositoryTransaction(async () => {
    const repository = getRepository();
    const profile = await repository.updateAiModelProfile({
      profileId,
      ...normalized,
      updatedAt: now
    });

    await repository.createAdminAuditLog({
      adminUserId: admin.user.id,
      adminPhone: admin.user.phone,
      action: "ai_model.profile.update",
      targetType: "ai_model_profile",
      targetId: profile.id,
      summary: `Update AI model profile ${profile.provider}/${profile.model}`,
      metadata: safeProfileMetadata(profile),
      requestId: input.requestId,
      requestIp: input.requestIp,
      createdAt: now
    });

    return {
      profile: toAdminAiModelProfileSummary(profile, null, new Set([profile.apiKeySecretId].filter(Boolean) as string[]))
    };
  });
}

export async function setAdminAiModelProfileEnabled(input: {
  profileId: string;
  enabled: boolean;
  requestId: string;
  requestIp: string | null;
}) {
  const admin = await requireModelConfigWrite();
  const profileId = normalizeId(input.profileId, "profileId");
  const repository = getRepository();
  const profile = await repository.findAiModelProfileById(profileId);

  if (!profile) {
    throw new ApiError("NOT_FOUND", "模型配置不存在", 404);
  }

  if (!input.enabled) {
    const active = await repository.getActiveAiModelProfile();

    if (active?.id === profileId) {
      throw new ApiError("VALIDATION_ERROR", "当前生效模型不能直接禁用，请先切换到其他模型", 400);
    }
  }

  if (input.enabled) {
    await validateProfileOrThrow(profile);
  }

  const now = new Date().toISOString();

  return withRepositoryTransaction(async () => {
    const transactionRepository = getRepository();
    const updated = await transactionRepository.updateAiModelProfileEnabled({
      profileId,
      enabled: input.enabled,
      updatedAt: now
    });

    await transactionRepository.createAdminAuditLog({
      adminUserId: admin.user.id,
      adminPhone: admin.user.phone,
      action: input.enabled ? "ai_model.profile.enable" : "ai_model.profile.disable",
      targetType: "ai_model_profile",
      targetId: updated.id,
      summary: `${input.enabled ? "Enable" : "Disable"} AI model profile ${updated.provider}/${updated.model}`,
      metadata: safeProfileMetadata(updated),
      requestId: input.requestId,
      requestIp: input.requestIp,
      createdAt: now
    });

    return {
      profile: toAdminAiModelProfileSummary(updated, null, new Set([updated.apiKeySecretId].filter(Boolean) as string[]))
    };
  });
}

export async function switchAdminActiveAiModelProfile(input: {
  profileId: string;
  requestId: string;
  requestIp: string | null;
}) {
  const admin = await requireModelConfigWrite();
  const profileId = normalizeId(input.profileId, "profileId");
  const profile = await getRepository().findAiModelProfileById(profileId);

  if (!profile || !profile.enabled) {
    throw new ApiError("NOT_FOUND", "模型配置不存在或未启用", 404);
  }

  await validateProfileOrThrow(profile);

  const now = new Date().toISOString();
  const updatedProfile = await withRepositoryTransaction(async () => {
    const repository = getRepository();
    const activeProfile = await repository.setActiveAiModelProfile({
      profileId,
      updatedAt: now
    });

    await repository.createAdminAuditLog({
      adminUserId: admin.user.id,
      adminPhone: admin.user.phone,
      action: "ai_model.switch",
      targetType: "ai_model_profile",
      targetId: activeProfile.id,
      summary: `Switch AI model profile to ${activeProfile.provider}/${activeProfile.model}`,
      metadata: safeProfileMetadata(activeProfile),
      requestId: input.requestId,
      requestIp: input.requestIp,
      createdAt: now
    });

    return activeProfile;
  });

  return {
    profile: toAdminAiModelProfileSummary(updatedProfile, updatedProfile.id, new Set([updatedProfile.apiKeySecretId].filter(Boolean) as string[]))
  };
}

export async function upsertAdminAiModelSecret(input: {
  secretId?: string;
  name: string;
  provider?: string;
  apiKey: string;
  requestId: string;
  requestIp: string | null;
}) {
  const admin = await requireModelConfigWrite();

  if (!isConfigEncryptionConfigured()) {
    throw new ApiError("VALIDATION_ERROR", "CONFIG_ENCRYPTION_KEY 未配置，不能保存模型 API Key", 400);
  }

  const now = new Date().toISOString();
  const secretId = input.secretId ? normalizeId(input.secretId, "secretId") : undefined;
  const name = normalizeText(input.name, "name", 1, 80);
  const provider = input.provider ? normalizeProvider(input.provider) : null;
  const apiKey = normalizeText(input.apiKey, "apiKey", 8, 4096);
  const encryptedValue = encryptConfigSecret(apiKey);

  return withRepositoryTransaction(async () => {
    const repository = getRepository();
    const secret = await repository.upsertAiModelSecret({
      secretId,
      name,
      provider,
      encryptedValue,
      keyHint: null,
      createdAt: now,
      updatedAt: now
    });

    await repository.createAdminAuditLog({
      adminUserId: admin.user.id,
      adminPhone: admin.user.phone,
      action: secretId ? "ai_model.secret.update" : "ai_model.secret.create",
      targetType: "ai_model_secret",
      targetId: secret.id,
      summary: `${secretId ? "Update" : "Create"} AI model API key secret ${secret.name}`,
      metadata: {
        secretId: secret.id,
        name: secret.name,
        provider: secret.provider,
        configured: true
      },
      requestId: input.requestId,
      requestIp: input.requestIp,
      createdAt: now
    });

    return {
      secret: toAdminAiModelSecretSummary(secret)
    };
  });
}

export async function createDefaultAdminAiModelProfiles(input: {
  requestId: string;
  requestIp: string | null;
}) {
  const admin = await requireModelConfigWrite();
  const repository = getRepository();
  const existing = await repository.listAiModelProfiles();
  const existingKeys = new Set(existing.map((profile) => `${profile.provider}:${profile.baseUrl}:${profile.model}`));
  const now = new Date().toISOString();
  const defaults = [
    {
      name: "Xiaomi MIMO",
      provider: "openai_compatible" as AiModelProvider,
      baseUrl: "https://token-plan-cn.xiaomimo.com",
      model: "mimo-v2.5-pro",
      supportsVision: false,
      apiKeyEnvName: null,
      apiKeySecretId: null,
      enabled: false
    },
    {
      name: "DeepSeek Chat",
      provider: "deepseek" as AiModelProvider,
      baseUrl: "https://api.deepseek.com/v1",
      model: "deepseek-chat",
      supportsVision: false,
      apiKeyEnvName: null,
      apiKeySecretId: null,
      enabled: false
    }
  ].filter((profile) => !existingKeys.has(`${profile.provider}:${profile.baseUrl}:${profile.model}`));

  return withRepositoryTransaction(async () => {
    const transactionRepository = getRepository();
    const created: AiModelProfile[] = [];

    for (const profile of defaults) {
      created.push(await transactionRepository.createAiModelProfile({
        ...profile,
        createdAt: now,
        updatedAt: now
      }));
    }

    if (created.length > 0) {
      await transactionRepository.createAdminAuditLog({
        adminUserId: admin.user.id,
        adminPhone: admin.user.phone,
        action: "ai_model.profile.defaults_create",
        targetType: "ai_model_profile",
        targetId: "defaults",
        summary: `Create ${created.length} default AI model profiles`,
        metadata: {
          profiles: created.map(safeProfileMetadata)
        },
        requestId: input.requestId,
        requestIp: input.requestIp,
        createdAt: now
      });
    }

    return {
      created: created.map((profile) => toAdminAiModelProfileSummary(profile, null, new Set()))
    };
  });
}

async function requireModelConfigWrite() {
  const admin = await requireAdmin();

  if (!isAdminWriteEnabled() || !isAdminModelConfigWriteEnabled()) {
    throw new ApiError("FORBIDDEN", "模型配置写操作未开启", 403);
  }

  return admin;
}

async function normalizeProfileInput(input: {
  name: string;
  provider: string;
  baseUrl: string;
  model: string;
  supportsVision: boolean;
  apiKeyEnvName?: string;
  apiKeySecretId?: string;
  enabled: boolean;
}, now: string) {
  const provider = normalizeProvider(input.provider);
  const name = normalizeText(input.name, "name", 1, 80);
  const baseUrl = normalizeText(input.baseUrl, "baseUrl", 1, 240);
  const model = normalizeText(input.model, "model", 1, 120);
  const apiKeyEnvName = input.apiKeyEnvName?.trim() || null;
  const apiKeySecretId = input.apiKeySecretId?.trim() || null;

  if (!isValidAiBaseUrl(provider, baseUrl)) {
    throw new ApiError("VALIDATION_ERROR", "Base URL 必须是有效地址，非 mock provider 必须使用 https", 400);
  }

  if (apiKeyEnvName && !isAllowedAiApiKeyEnvName(apiKeyEnvName)) {
    throw new ApiError("VALIDATION_ERROR", "API Key 环境变量不在允许名单中", 400);
  }

  if (apiKeyEnvName && apiKeySecretId) {
    throw new ApiError("VALIDATION_ERROR", "API Key 只能选择环境变量或数据库密钥之一", 400);
  }

  if (apiKeySecretId) {
    normalizeId(apiKeySecretId, "apiKeySecretId");
    const secret = await getRepository().findAiModelSecretById(apiKeySecretId);

    if (!secret) {
      throw new ApiError("VALIDATION_ERROR", "选择的 API Key 不存在", 400);
    }
  }

  const normalized = {
    name,
    provider,
    baseUrl,
    model,
    supportsVision: Boolean(input.supportsVision),
    apiKeyEnvName: apiKeyEnvName as AllowedAiApiKeyEnvName | null,
    apiKeySecretId,
    enabled: Boolean(input.enabled)
  };

  if (normalized.enabled) {
    await validateProfileOrThrow({
      id: "00000000-0000-0000-0000-000000000000",
      ...normalized,
      createdAt: now,
      updatedAt: now
    });
  }

  return normalized;
}

async function validateProfileOrThrow(profile: AiModelProfile) {
  try {
    await validateAiModelProfileForRuntime(profile);
  } catch (error) {
    if (error instanceof ServerConfigError) {
      throw new ApiError("VALIDATION_ERROR", error.message, 400);
    }

    throw error;
  }
}

function toAdminAiModelProfileSummary(
  profile: AiModelProfile,
  activeProfileId: string | null,
  configuredSecretIds: Set<string>
): AdminAiModelProfileSummary {
  const apiKeySecretConfigured = Boolean(profile.apiKeySecretId && configuredSecretIds.has(profile.apiKeySecretId));
  const apiKeyEnvConfigured = Boolean(profile.apiKeyEnvName && process.env[profile.apiKeyEnvName]?.trim());
  const apiKeySource = profile.apiKeySecretId ? "database secret" : profile.apiKeyEnvName ? "env" : "none";

  return {
    id: profile.id,
    name: profile.name,
    provider: profile.provider,
    baseUrl: profile.baseUrl,
    baseUrlHost: sanitizeBaseUrlForAdmin(profile.baseUrl),
    model: profile.model,
    supportsVision: profile.supportsVision,
    apiKeyEnvName: isAllowedAiApiKeyEnvName(profile.apiKeyEnvName) ? profile.apiKeyEnvName : null,
    apiKeySecretId: profile.apiKeySecretId,
    apiKeySource,
    apiKeyConfigured: apiKeySecretConfigured || apiKeyEnvConfigured || profile.provider === "mock",
    enabled: profile.enabled,
    active: profile.id === activeProfileId,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt
  };
}

function toAdminAiModelSecretSummary(secret: AiModelSecret): AdminAiModelSecretSummary {
  return {
    id: secret.id,
    name: secret.name,
    provider: secret.provider,
    configured: true,
    createdAt: secret.createdAt,
    updatedAt: secret.updatedAt
  };
}

function safeProfileMetadata(profile: AiModelProfile) {
  return {
    profileId: profile.id,
    profileName: profile.name,
    provider: profile.provider,
    model: profile.model,
    baseUrlHost: sanitizeBaseUrlForAdmin(profile.baseUrl),
    supportsVision: profile.supportsVision,
    apiKeyEnvName: profile.apiKeyEnvName,
    apiKeySecretId: profile.apiKeySecretId,
    enabled: profile.enabled
  };
}

function normalizeProvider(value: string): AiModelProvider {
  const provider = value.trim();

  if (!isAiProviderMode(provider)) {
    throw new ApiError("VALIDATION_ERROR", "provider 参数不正确", 400);
  }

  return provider;
}

function normalizeId(value: string, field: string) {
  const id = value.trim();

  if (!/^[0-9a-fA-F-]{16,64}$/.test(id)) {
    throw new ApiError("VALIDATION_ERROR", `${field} 参数不正确`, 400);
  }

  return id;
}

function normalizeText(value: string, field: string, min: number, max: number) {
  const normalized = value.trim();

  if (normalized.length < min || normalized.length > max) {
    throw new ApiError("VALIDATION_ERROR", `${field} 长度必须在 ${min}-${max} 个字符之间`, 400);
  }

  return normalized;
}

function getAdminSecretStatuses(): AdminSecretStatus[] {
  return [
    getSecretStatus("LIGHTQUANT_AI_API_KEY", ["LIGHTQUANT_AI_API_KEY"], () => "unknown"),
    getSecretStatus("DEEPSEEK_API_KEY", ["DEEPSEEK_API_KEY"], () => "unknown"),
    getSecretStatus("CONFIG_ENCRYPTION_KEY", ["CONFIG_ENCRYPTION_KEY", "APP_CONFIG_ENCRYPTION_KEY"], isConfigEncryptionKeyFormatValid),
    getSecretStatus("TENCENT_SECRET_ID", ["TENCENT_SECRET_ID", "TENCENTCLOUD_SECRET_ID"], () => "unknown"),
    getSecretStatus("TENCENT_SECRET_KEY", ["TENCENT_SECRET_KEY", "TENCENTCLOUD_SECRET_KEY"], () => "unknown"),
    getSecretStatus("ALIPAY_PRIVATE_KEY", ["ALIPAY_PRIVATE_KEY"], () => "unknown"),
    getSecretStatus("ALIPAY_PUBLIC_KEY", ["ALIPAY_PUBLIC_KEY"], () => "unknown"),
    getSecretStatus("WECHAT_PAY_PRIVATE_KEY", ["WECHAT_PAY_PRIVATE_KEY"], () => "unknown"),
    getSecretStatus("WECHAT_PAY_API_KEY", ["WECHAT_PAY_API_KEY"], isWechatApiKeyFormatValid),
    getSecretStatus("DATABASE_URL", ["DATABASE_URL"], isDatabaseUrlFormatValid),
    getSecretStatus("AUTH_SECRET", ["AUTH_SECRET"], isAuthSecretFormatValid)
  ];
}

function getSecretStatus(
  name: string,
  envNames: string[],
  validate: (value: string) => SecretFormatValid
): AdminSecretStatus {
  const value = envNames.map((envName) => process.env[envName]?.trim()).find(Boolean);
  const configured = Boolean(value);
  const formatValid = configured ? validate(value as string) : false;

  return {
    name,
    configured,
    formatValid,
    source: "env",
    hint: getSecretStatusHint(name, envNames, configured, formatValid)
  };
}

function getSecretStatusHint(name: string, envNames: string[], configured: boolean, formatValid: SecretFormatValid) {
  if (!configured) {
    return `缺少 ${envNames.join(" / ")}`;
  }

  if (formatValid === false) {
    return `${name} 格式可能不符合当前服务要求`;
  }

  if (formatValid === "unknown") {
    return `${name} 已配置，格式需由对应服务验证`;
  }

  return `${name} 已配置`;
}

function isConfigEncryptionKeyFormatValid(value: string): SecretFormatValid {
  try {
    return Buffer.from(value, "base64").length === 32;
  } catch {
    return false;
  }
}

function isWechatApiKeyFormatValid(value: string): SecretFormatValid {
  return Buffer.byteLength(value, "utf8") === 32;
}

function isDatabaseUrlFormatValid(value: string): SecretFormatValid {
  try {
    const parsed = new URL(value);

    return parsed.protocol === "postgresql:" || parsed.protocol === "postgres:";
  } catch {
    return false;
  }
}

function isAuthSecretFormatValid(value: string): SecretFormatValid {
  return value.length >= 32;
}
