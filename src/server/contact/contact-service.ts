import type { ContactCategory, ContactMethod } from "@/server/domain";
import { getRepository } from "@/server/repositories";
import { ApiError } from "@/server/http/api-response";

const contactMethods: ContactMethod[] = ["邮箱", "微信号", "手机号"];
const contactCategories: ContactCategory[] = ["使用问题", "策略生成", "代码转换", "积分/充值", "其他"];

export async function createContactRequest(input: {
  userId: string;
  name: string;
  contactMethod: string;
  contactValue: string;
  category: string;
  message: string;
  source: string;
  requestIp: string | null;
  userAgent: string | null;
}) {
  const repository = getRepository();
  const user = await repository.findUserById(input.userId);

  if (!user) {
    throw new ApiError("UNAUTHORIZED", "请先登录后提交留言", 401);
  }

  if (user.status !== "active") {
    throw new ApiError("FORBIDDEN", "当前账号不可用，暂时不能提交留言", 403);
  }

  const now = new Date().toISOString();
  const rateLimitSince = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const userRequestCount = await repository.countContactRequestsByUserSince(user.id, rateLimitSince);

  if (userRequestCount >= 10) {
    throw new ApiError("RATE_LIMITED", "提交过于频繁，请稍后再试", 429);
  }

  if (input.requestIp) {
    const ipRequestCount = await repository.countContactRequestsByRequestIpSince(input.requestIp, rateLimitSince);

    if (ipRequestCount >= 30) {
      throw new ApiError("RATE_LIMITED", "提交过于频繁，请稍后再试", 429);
    }
  }

  const request = await repository.createContactRequest({
    userId: user.id,
    userPhone: user.phone,
    name: normalizeText(input.name, "称呼", 1, 80),
    contactMethod: normalizeContactMethod(input.contactMethod),
    contactValue: normalizeText(input.contactValue, "联系方式内容", 1, 160),
    category: normalizeContactCategory(input.category),
    message: normalizeText(input.message, "留言内容", 1, 3000),
    source: normalizeText(input.source, "提交来源", 1, 240),
    requestIp: input.requestIp,
    userAgent: normalizeOptionalText(input.userAgent, 300),
    createdAt: now,
    updatedAt: now
  });

  return {
    id: request.id,
    message: "已收到您的信息，我们会尽快联系您"
  };
}

function normalizeContactMethod(value: string): ContactMethod {
  const normalized = value.trim();

  if (contactMethods.includes(normalized as ContactMethod)) {
    return normalized as ContactMethod;
  }

  throw new ApiError("VALIDATION_ERROR", "联系方式类型不正确", 400);
}

function normalizeContactCategory(value: string): ContactCategory {
  const normalized = value.trim();

  if (contactCategories.includes(normalized as ContactCategory)) {
    return normalized as ContactCategory;
  }

  throw new ApiError("VALIDATION_ERROR", "问题类型不正确", 400);
}

function normalizeText(value: string, label: string, min: number, max: number) {
  const normalized = value.trim();

  if (normalized.length < min || normalized.length > max) {
    throw new ApiError("VALIDATION_ERROR", `${label}需为 ${min}-${max} 个字符`, 400);
  }

  return normalized;
}

function normalizeOptionalText(value: string | null, max: number) {
  const normalized = value?.trim();

  if (!normalized) {
    return null;
  }

  return normalized.slice(0, max);
}
