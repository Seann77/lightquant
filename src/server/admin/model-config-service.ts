import { requireAdmin } from "@/server/admin/admin-auth";
import {
  isAdminModelConfigWriteEnabled,
  isAdminWriteEnabled,
  ServerConfigError
} from "@/server/env";
import { ApiError } from "@/server/http/api-response";
import {
  ALLOWED_AI_API_KEY_ENV_NAMES,
  isAiProviderMode,
  isAllowedAiApiKeyEnvName,
  isValidAiBaseUrl,
  sanitizeBaseUrlForAdmin,
  summarizeAiRuntimeConfig,
  validateAiModelProfileForRuntime,
  type AiRuntimeConfigSummary
} from "@/server/ai/ai-runtime-config";
import type { AiModelProfile, AiModelProvider, AiModelSecret } from "@/server/domain";
import { getRepository, withRepositoryTransaction } from "@/server/repositories";
import { encryptConfigSecret, isConfigEncryptionConfigured } from "@/server/security/config-encryption";

type SecretFormatValid = boolean | "unknown";

export type AdminModelConfigResponse = {
  current: AiRuntimeConfigSummary;
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
  provider: AiModelProvider;
  baseUrl: string;
  baseUrlHost: string;
  model: string;
  supportsVision: boolean;
  apiKeyEnvName: string | null;
  apiKeySecretId: string | null;
  apiKeySecretName: string | null;
  apiKeyConfigured: boolean;
  keySource: "database secret" | "env" | "none";
  enabled: boolean;
  active: boolean;
  configValid: boolean;
  errorHint: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminAiModelSecretSummary = {
  id: string;
  name: string;
  provider: AiModelProvider | null;
  configured: boolean;
  keyHint: string | null;
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

type AuditContext = {
  requestId: string;
  requestIp: string | null;
};

export async function getAdminModelConfig(): Promise<AdminModelConfigResponse> {
  await requireAdmin();

  const repository = getRepository();
  const [profiles, activeProfile, secrets] = await Promise.all([
    repository.listAiModelProfiles(),
    repository.getActiveAiModelProfile(),
    repository.listAiModelSecrets()
  ]);

  return {
    current: await summarizeAiRuntimeConfig(activeProfile),
    profiles: await Promise.all(profiles.map((profile) => toAdminAiModelProfileSummary(profile, {
      activeProfileId: activeProfile?.id ?? null,
      secrets
    }))),
    secrets: secrets.map(toAdminAiModelSecretSummary),
    keyStatuses: getAdminSecretStatuses(),
    writeGuards: {
      adminWriteEnabled: isAdminWriteEnabled(),
      modelConfigWriteEnabled: isAdminModelConfigWriteEnabled(),
      configEncryptionConfigured: isConfigEncryptionConfigured()
    }
  };
}

export async function createAdminAiModelProfile(input: Record<string, unknown>, context: AuditContext) {
  const admin = await requireModelConfigWrite();
  const now = new Date().toISOString();
  const normalized = await normalizeProfileInput(input, { creating: true });

  if (normalized.enabled) {
    await assertProfileRuntimeReady({ ...normalized, id: "preview", createdAt: now, updatedAt: now });
  }

  const profile = await withRepositoryTransaction(async () => {
    const repository = getRepository();
    const created = await repository.createAiModelProfile({
      ...normalized,
      createdAt: now,
      updatedAt: now
    });

    await repository.createAdminAuditLog({
      adminUserId: admin.user.id,
      adminPhone: admin.user.phone,
      action: "ai_model.profile.create",
      targetType: "ai_model_profile",
      targetId: created.id,
      summary: `创建 AI 模型 Profile：${created.name}`,
      metadata: profileAuditMetadata(created),
      requestId: context.requestId,
      requestIp: context.requestIp,
      createdAt: now
    });

    return created;
  });

  return {
    profile: await toAdminAiModelProfileSummary(profile, await getSummaryContext())
  };
}

export async function updateAdminAiModelProfile(profileIdInput: string, input: Record<string, unknown>, context: AuditContext) {
  const admin = await requireModelConfigWrite();
  const profileId = normalizeId(profileIdInput, "profileId");
  const repository = getRepository();
  const existing = await repository.findAiModelProfileById(profileId);

  if (!existing) {
    throw new ApiError("NOT_FOUND", "模型 Profile 不存在", 404);
  }

  const normalized = await normalizeProfileInput(input, { creating: false, existing });
  const candidate = {
    ...existing,
    ...normalized
  };

  if (existing.enabled && normalized.enabled === false && (await repository.getActiveAiModelProfile())?.id === existing.id) {
    throw new ApiError("VALIDATION_ERROR", "不能停用当前生效 Profile，请先切换到其他 Profile", 400);
  }

  if (candidate.enabled) {
    await assertProfileRuntimeReady(candidate);
  }

  const now = new Date().toISOString();
  const updated = await withRepositoryTransaction(async () => {
    const scopedRepository = getRepository();
    const result = await scopedRepository.updateAiModelProfile(profileId, {
      ...normalized,
      updatedAt: now
    });

    await scopedRepository.createAdminAuditLog({
      adminUserId: admin.user.id,
      adminPhone: admin.user.phone,
      action: "ai_model.profile.update",
      targetType: "ai_model_profile",
      targetId: result.id,
      summary: `更新 AI 模型 Profile：${result.name}`,
      metadata: profileAuditMetadata(result),
      requestId: context.requestId,
      requestIp: context.requestIp,
      createdAt: now
    });

    return result;
  });

  return {
    profile: await toAdminAiModelProfileSummary(updated, await getSummaryContext())
  };
}

export async function setAdminAiModelProfileEnabled(profileIdInput: string, enabled: boolean, context: AuditContext) {
  const admin = await requireModelConfigWrite();
  const profileId = normalizeId(profileIdInput, "profileId");
  const repository = getRepository();
  const existing = await repository.findAiModelProfileById(profileId);

  if (!existing) {
    throw new ApiError("NOT_FOUND", "模型 Profile 不存在", 404);
  }

  const activeProfile = await repository.getActiveAiModelProfile();

  if (!enabled && activeProfile?.id === existing.id) {
    throw new ApiError("VALIDATION_ERROR", "不能停用当前生效 Profile，请先切换到其他 Profile", 400);
  }

  const candidate = {
    ...existing,
    enabled
  };

  if (enabled) {
    await assertProfileRuntimeReady(candidate);
  }

  const now = new Date().toISOString();
  const updated = await withRepositoryTransaction(async () => {
    const scopedRepository = getRepository();
    const result = await scopedRepository.updateAiModelProfile(profileId, {
      enabled,
      updatedAt: now
    });

    await scopedRepository.createAdminAuditLog({
      adminUserId: admin.user.id,
      adminPhone: admin.user.phone,
      action: enabled ? "ai_model.profile.enable" : "ai_model.profile.disable",
      targetType: "ai_model_profile",
      targetId: result.id,
      summary: `${enabled ? "启用" : "停用"} AI 模型 Profile：${result.name}`,
      metadata: profileAuditMetadata(result),
      requestId: context.requestId,
      requestIp: context.requestIp,
      createdAt: now
    });

    return result;
  });

  return {
    profile: await toAdminAiModelProfileSummary(updated, await getSummaryContext())
  };
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
    throw new ApiError("NOT_FOUND", "模型 Profile 不存在或未启用", 404);
  }

  await assertProfileRuntimeReady(profile);

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
      summary: `切换 AI 模型 Profile：${activeProfile.name}`,
      metadata: profileAuditMetadata(activeProfile),
      requestId: input.requestId,
      requestIp: input.requestIp,
      createdAt: now
    });

    return activeProfile;
  });

  return {
    profile: await toAdminAiModelProfileSummary(updatedProfile, await getSummaryContext())
  };
}

export async function upsertAdminAiModelSecret(input: Record<string, unknown>, context: AuditContext) {
  const admin = await requireModelConfigWrite();
  const normalized = normalizeSecretInput(input);
  const now = new Date().toISOString();

  let encryptedValue: string;

  try {
    encryptedValue = encryptConfigSecret(normalized.apiKey);
  } catch (error) {
    if (error instanceof ServerConfigError) {
      throw new ApiError("VALIDATION_ERROR", "服务器未配置 CONFIG_ENCRYPTION_KEY 或 APP_CONFIG_ENCRYPTION_KEY，不能写入模型 API Key", 400);
    }

    throw error;
  }

  const secret = await withRepositoryTransaction(async () => {
    const repository = getRepository();
    const saved = await repository.upsertAiModelSecret({
      id: normalized.id ?? undefined,
      name: normalized.name,
      provider: normalized.provider,
      encryptedValue,
      keyHint: null,
      createdAt: now,
      updatedAt: now
    });

    await repository.createAdminAuditLog({
      adminUserId: admin.user.id,
      adminPhone: admin.user.phone,
      action: normalized.id ? "ai_model.secret.update" : "ai_model.secret.create",
      targetType: "ai_model_secret",
      targetId: saved.id,
      summary: `${normalized.id ? "更新" : "创建"} AI 模型 API Key：${saved.name}`,
      metadata: {
        secretId: saved.id,
        name: saved.name,
        provider: saved.provider,
        configured: true
      },
      requestId: context.requestId,
      requestIp: context.requestIp,
      createdAt: now
    });

    return saved;
  });

  return {
    secret: toAdminAiModelSecretSummary(secret)
  };
}

export async function createDefaultAdminAiModelProfiles(context: AuditContext) {
  const admin = await requireModelConfigWrite();
  const repository = getRepository();
  const existing = await repository.listAiModelProfiles();
  const now = new Date().toISOString();
  const defaults = getDefaultProfiles(existing);

  if (defaults.length === 0) {
    const summaryContext = await getSummaryContext();

    return {
      profiles: await Promise.all(existing.map((profile) => toAdminAiModelProfileSummary(profile, summaryContext)))
    };
  }

  const created = await withRepositoryTransaction(async () => {
    const scopedRepository = getRepository();
    const items: AiModelProfile[] = [];

    for (const profile of defaults) {
      const item = await scopedRepository.createAiModelProfile({
        ...profile,
        createdAt: now,
        updatedAt: now
      });
      items.push(item);
    }

    await scopedRepository.createAdminAuditLog({
      adminUserId: admin.user.id,
      adminPhone: admin.user.phone,
      action: "ai_model.profile.seed_defaults",
      targetType: "ai_model_profile",
      targetId: "defaults",
      summary: "创建默认 AI 模型 Profiles",
      metadata: {
        count: items.length,
        profiles: items.map((item) => profileAuditMetadata(item))
      },
      requestId: context.requestId,
      requestIp: context.requestIp,
      createdAt: now
    });

    return items;
  });

  const summaryContext = await getSummaryContext();

  return {
    profiles: await Promise.all(created.map((profile) => toAdminAiModelProfileSummary(profile, summaryContext)))
  };
}

async function requireModelConfigWrite() {
  const admin = await requireAdmin();

  if (!isAdminWriteEnabled() || !isAdminModelConfigWriteEnabled()) {
    throw new ApiError("FORBIDDEN", "模型配置写操作未开启", 403);
  }

  return admin;
}

async function toAdminAiModelProfileSummary(
  profile: AiModelProfile,
  context: { activeProfileId: string | null; secrets: AiModelSecret[] }
): Promise<AdminAiModelProfileSummary> {
  const secret = profile.apiKeySecretId ? context.secrets.find((item) => item.id === profile.apiKeySecretId) ?? null : null;
  const keySource = profile.apiKeySecretId ? "database secret" : profile.apiKeyEnvName ? "env" : "none";
  const apiKeyConfigured = profile.provider === "mock"
    ? false
    : profile.apiKeySecretId
      ? Boolean(secret)
      : Boolean(profile.apiKeyEnvName && process.env[profile.apiKeyEnvName]?.trim());
  const runtimeSummary = profile.enabled ? await summarizeProfileCandidate(profile) : null;

  return {
    id: profile.id,
    name: profile.name,
    provider: profile.provider,
    baseUrl: profile.baseUrl,
    baseUrlHost: sanitizeBaseUrlForAdmin(profile.baseUrl),
    model: profile.model,
    supportsVision: profile.supportsVision,
    apiKeyEnvName: profile.apiKeyEnvName,
    apiKeySecretId: profile.apiKeySecretId,
    apiKeySecretName: secret?.name ?? null,
    apiKeyConfigured,
    keySource,
    enabled: profile.enabled,
    active: profile.id === context.activeProfileId,
    configValid: runtimeSummary?.configValid ?? !profile.enabled,
    errorHint: runtimeSummary?.errorHint ?? null,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt
  };
}

async function summarizeProfileCandidate(profile: AiModelProfile) {
  return summarizeAiRuntimeConfig(profile);
}

function toAdminAiModelSecretSummary(secret: AiModelSecret): AdminAiModelSecretSummary {
  return {
    id: secret.id,
    name: secret.name,
    provider: secret.provider,
    configured: Boolean(secret.encryptedValue),
    keyHint: secret.keyHint,
    createdAt: secret.createdAt,
    updatedAt: secret.updatedAt
  };
}

function getAdminSecretStatuses(): AdminSecretStatus[] {
  return [
    getSecretStatus("LIGHTQUANT_AI_API_KEY", ["LIGHTQUANT_AI_API_KEY"], () => "unknown"),
    getSecretStatus("DEEPSEEK_API_KEY", ["DEEPSEEK_API_KEY"], () => "unknown"),
    {
      name: "CONFIG_ENCRYPTION_KEY",
      configured: isConfigEncryptionConfigured(),
      formatValid: isConfigEncryptionConfigured() ? "unknown" : false,
      source: "env",
      hint: isConfigEncryptionConfigured()
        ? "模型 API Key 数据库加密已配置"
        : "缺少 CONFIG_ENCRYPTION_KEY 或 APP_CONFIG_ENCRYPTION_KEY，不能写入模型 API Key"
    }
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
    hint: configured ? `${name} 已配置` : `缺少 ${envNames.join(" / ")}`
  };
}

async function getSummaryContext() {
  const repository = getRepository();
  const [activeProfile, secrets] = await Promise.all([
    repository.getActiveAiModelProfile(),
    repository.listAiModelSecrets()
  ]);

  return {
    activeProfileId: activeProfile?.id ?? null,
    secrets
  };
}

async function normalizeProfileInput(
  input: Record<string, unknown>,
  options: { creating: true } | { creating: false; existing: AiModelProfile }
) {
  const existing = options.creating ? null : options.existing;
  const provider = normalizeProvider(readMaybeString(input.provider) ?? existing?.provider ?? "");
  const name = normalizeLength(readMaybeString(input.name) ?? existing?.name ?? "", "name", 1, 80);
  const baseUrl = normalizeBaseUrl(readMaybeString(input.baseUrl) ?? existing?.baseUrl ?? "", provider);
  const model = normalizeLength(readMaybeString(input.model) ?? existing?.model ?? "", "model", 1, 120);
  const supportsVision = readMaybeBoolean(input.supportsVision) ?? existing?.supportsVision ?? false;
  const enabled = readMaybeBoolean(input.enabled) ?? existing?.enabled ?? false;
  const rawApiKeySecretId = readNullableStringField(input, "apiKeySecretId", existing?.apiKeySecretId ?? null);
  const rawApiKeyEnvName = readNullableStringField(input, "apiKeyEnvName", existing?.apiKeyEnvName ?? null);
  const apiKeySecretId = normalizeOptionalId(rawApiKeySecretId, "apiKeySecretId");
  const apiKeyEnvName = normalizeOptionalApiKeyEnvName(rawApiKeyEnvName);

  if (apiKeySecretId && apiKeyEnvName) {
    throw new ApiError("VALIDATION_ERROR", "apiKeySecretId 和 apiKeyEnvName 只能选择一个", 400);
  }

  if (apiKeySecretId) {
    const secret = await getRepository().findAiModelSecretById(apiKeySecretId);

    if (!secret) {
      throw new ApiError("VALIDATION_ERROR", "绑定的模型 API Key 不存在", 400);
    }
  }

  return {
    name,
    provider,
    baseUrl,
    model,
    supportsVision,
    apiKeyEnvName,
    apiKeySecretId,
    enabled
  };
}

function normalizeSecretInput(input: Record<string, unknown>) {
  const id = normalizeOptionalId(readMaybeString(input.id) ?? null, "id");
  const name = normalizeLength(readMaybeString(input.name) ?? "", "name", 1, 80);
  const providerValue = readMaybeString(input.provider);
  const provider = providerValue ? normalizeProvider(providerValue) : null;
  const apiKey = normalizeLength(readMaybeString(input.apiKey) ?? "", "apiKey", 8, 400);

  return {
    id,
    name,
    provider,
    apiKey
  };
}

async function assertProfileRuntimeReady(profile: AiModelProfile | (Omit<AiModelProfile, "id" | "createdAt" | "updatedAt"> & { id: string; createdAt: string; updatedAt: string })) {
  if (profile.provider !== "mock" && !profile.apiKeySecretId && !profile.apiKeyEnvName) {
    throw new ApiError("VALIDATION_ERROR", "非 mock Profile 启用或切换前必须绑定可用 API Key", 400);
  }

  try {
    await validateAiModelProfileForRuntime(profile);
  } catch (error) {
    if (error instanceof ServerConfigError) {
      throw new ApiError("VALIDATION_ERROR", "目标模型 Profile 不可用，请先检查 baseUrl/model/API Key", 400);
    }

    throw error;
  }
}

function profileAuditMetadata(profile: AiModelProfile) {
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

function getDefaultProfiles(existing: AiModelProfile[]) {
  const existingKeys = new Set(existing.map((profile) => `${profile.provider}:${profile.model}:${sanitizeBaseUrlForAdmin(profile.baseUrl)}`));
  const envBaseUrl = process.env.LIGHTQUANT_AI_BASE_URL?.trim();
  const mimoBaseUrl = envBaseUrl && envBaseUrl.includes("xiaomimimo")
    ? envBaseUrl
    : "https://token-plan-cn.xiaomimimo.com/v1";
  const defaults = [
    {
      name: "小米 MIMO",
      provider: "openai_compatible" as const,
      baseUrl: mimoBaseUrl,
      model: "mimo-v2.5-pro",
      supportsVision: false,
      apiKeyEnvName: null,
      apiKeySecretId: null,
      enabled: false
    },
    {
      name: "DeepSeek",
      provider: "deepseek" as const,
      baseUrl: "https://api.deepseek.com",
      model: "deepseek-chat",
      supportsVision: false,
      apiKeyEnvName: null,
      apiKeySecretId: null,
      enabled: false
    }
  ];

  return defaults.filter((profile) => !existingKeys.has(`${profile.provider}:${profile.model}:${sanitizeBaseUrlForAdmin(profile.baseUrl)}`));
}

function normalizeProvider(value: string): AiModelProvider {
  const normalized = value.trim();

  if (!isAiProviderMode(normalized)) {
    throw new ApiError("VALIDATION_ERROR", "provider 必须是 mock、deepseek 或 openai_compatible", 400);
  }

  return normalized;
}

function normalizeBaseUrl(value: string, provider: AiModelProvider) {
  const normalized = value.trim();

  if (!isValidAiBaseUrl(provider, normalized)) {
    throw new ApiError("VALIDATION_ERROR", provider === "mock" ? "mock provider 只允许 mock:// URL" : "baseUrl 必须是 HTTPS URL", 400);
  }

  return normalized;
}

function normalizeLength(value: string, field: string, min: number, max: number) {
  const normalized = value.trim();

  if (normalized.length < min || normalized.length > max) {
    throw new ApiError("VALIDATION_ERROR", `${field} 长度必须在 ${min}-${max} 个字符之间`, 400);
  }

  return normalized;
}

function normalizeOptionalId(value: string | null, field: string) {
  if (!value) {
    return null;
  }

  return normalizeId(value, field);
}

function normalizeId(value: string, field: string) {
  const normalized = value.trim();

  if (!/^[0-9a-fA-F-]{16,64}$/.test(normalized)) {
    throw new ApiError("VALIDATION_ERROR", `${field} 参数不正确`, 400);
  }

  return normalized;
}

function normalizeOptionalApiKeyEnvName(value: string | null) {
  const normalized = value?.trim() || null;

  if (!normalized) {
    return null;
  }

  if (!isAllowedAiApiKeyEnvName(normalized)) {
    throw new ApiError("VALIDATION_ERROR", `apiKeyEnvName 只允许 ${ALLOWED_AI_API_KEY_ENV_NAMES.join(" / ")}`, 400);
  }

  return normalized;
}

function readMaybeString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function readNullableStringField(input: Record<string, unknown>, field: string, fallback: string | null) {
  if (!Object.prototype.hasOwnProperty.call(input, field)) {
    return fallback;
  }

  const value = input[field];

  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  throw new ApiError("VALIDATION_ERROR", `${field} 参数不正确`, 400);
}

function readMaybeBoolean(value: unknown) {
  return typeof value === "boolean" ? value : undefined;
}
