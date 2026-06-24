import { requireAdmin } from "@/server/admin/admin-auth";
import {
  isAdminModelConfigWriteEnabled,
  isAdminWriteEnabled,
  ServerConfigError
} from "@/server/env";
import { ApiError } from "@/server/http/api-response";
import { sanitizeBaseUrlForAdmin, summarizeAiRuntimeConfig, validateAiModelProfileForRuntime } from "@/server/ai/ai-runtime-config";
import type { AiModelProfile } from "@/server/domain";
import { getRepository, withRepositoryTransaction } from "@/server/repositories";

type SecretFormatValid = boolean | "unknown";

export type AdminModelConfigResponse = {
  current: ReturnType<typeof summarizeAiRuntimeConfig>;
  profiles: AdminAiModelProfileSummary[];
  keyStatuses: AdminSecretStatus[];
  writeGuards: {
    adminWriteEnabled: boolean;
    modelConfigWriteEnabled: boolean;
  };
};

export type AdminAiModelProfileSummary = {
  id: string;
  name: string;
  provider: AiModelProfile["provider"];
  baseUrlHost: string;
  model: string;
  supportsVision: boolean;
  apiKeyEnvName: string | null;
  apiKeyConfigured: boolean;
  enabled: boolean;
  active: boolean;
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
  const [profiles, activeProfile] = await Promise.all([
    repository.listAiModelProfiles(),
    repository.getActiveAiModelProfile()
  ]);

  return {
    current: summarizeAiRuntimeConfig(activeProfile),
    profiles: profiles.map((profile) => toAdminAiModelProfileSummary(profile, activeProfile?.id ?? null)),
    keyStatuses: getAdminSecretStatuses(),
    writeGuards: {
      adminWriteEnabled: isAdminWriteEnabled(),
      modelConfigWriteEnabled: isAdminModelConfigWriteEnabled()
    }
  };
}

export async function switchAdminActiveAiModelProfile(input: {
  profileId: string;
  requestId: string;
  requestIp: string | null;
}) {
  const admin = await requireAdmin();

  if (!isAdminWriteEnabled() || !isAdminModelConfigWriteEnabled()) {
    throw new ApiError("FORBIDDEN", "模型配置写操作未开启", 403);
  }

  const profileId = normalizeProfileId(input.profileId);
  const profile = await getRepository().findAiModelProfileById(profileId);

  if (!profile || !profile.enabled) {
    throw new ApiError("NOT_FOUND", "模型配置不存在或未启用", 404);
  }

  try {
    validateAiModelProfileForRuntime(profile);
  } catch (error) {
    if (error instanceof ServerConfigError) {
      throw new ApiError("VALIDATION_ERROR", "目标模型配置不可用，请先检查服务器环境变量", 400);
    }

    throw error;
  }

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
      summary: `切换 AI 模型配置为 ${activeProfile.provider}/${activeProfile.model}`,
      metadata: {
        profileId: activeProfile.id,
        profileName: activeProfile.name,
        provider: activeProfile.provider,
        model: activeProfile.model,
        baseUrlHost: sanitizeBaseUrlForAdmin(activeProfile.baseUrl),
        supportsVision: activeProfile.supportsVision,
        apiKeyEnvName: activeProfile.apiKeyEnvName
      },
      requestId: input.requestId,
      requestIp: input.requestIp,
      createdAt: now
    });

    return activeProfile;
  });

  return {
    profile: toAdminAiModelProfileSummary(updatedProfile, updatedProfile.id)
  };
}

function toAdminAiModelProfileSummary(profile: AiModelProfile, activeProfileId: string | null): AdminAiModelProfileSummary {
  return {
    id: profile.id,
    name: profile.name,
    provider: profile.provider,
    baseUrlHost: sanitizeBaseUrlForAdmin(profile.baseUrl),
    model: profile.model,
    supportsVision: profile.supportsVision,
    apiKeyEnvName: profile.apiKeyEnvName,
    apiKeyConfigured: Boolean(profile.apiKeyEnvName && process.env[profile.apiKeyEnvName]?.trim()),
    enabled: profile.enabled,
    active: profile.id === activeProfileId,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt
  };
}

function normalizeProfileId(value: string) {
  const profileId = value.trim();

  if (!/^[0-9a-fA-F-]{16,64}$/.test(profileId)) {
    throw new ApiError("VALIDATION_ERROR", "profileId 参数不正确", 400);
  }

  return profileId;
}

function getAdminSecretStatuses(): AdminSecretStatus[] {
  return [
    getSecretStatus("LIGHTQUANT_AI_API_KEY", ["LIGHTQUANT_AI_API_KEY"], () => "unknown"),
    getSecretStatus("DEEPSEEK_API_KEY", ["DEEPSEEK_API_KEY"], () => "unknown"),
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
