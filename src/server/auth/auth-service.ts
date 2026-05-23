import { randomUUID } from "crypto";
import type { SmsScene, User } from "@/server/domain";
import { shouldExposeMockSmsCode } from "@/server/env";
import { ensureSignupBonus, toCreditAccountResponse } from "@/server/credits/credit-service";
import { ApiError } from "@/server/http/api-response";
import { getRepository } from "@/server/repositories";

const MOCK_SMS_CODE = "123456";
const SMS_CODE_TTL_MINUTES = 10;
const PHONE_PATTERN = /^1[3-9]\d{9}$/;

export async function requestSmsCode(input: { phone: string; scene?: SmsScene; requestIp: string | null }) {
  const phone = normalizePhone(input.phone);
  const scene = input.scene ?? "login";
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SMS_CODE_TTL_MINUTES * 60 * 1000).toISOString();
  const repository = getRepository();
  const record = await repository.createSmsCode({
    phone,
    scene,
    codeHash: null,
    mockCode: MOCK_SMS_CODE,
    expiresAt,
    requestIp: input.requestIp,
    createdAt: now.toISOString()
  });

  return {
    phone: record.phone,
    scene: record.scene,
    expiresAt: record.expiresAt,
    mockCode: shouldExposeMockSmsCode() ? MOCK_SMS_CODE : undefined
  };
}

export async function loginWithSmsCode(input: {
  phone: string;
  code: string;
  inviteCode?: string;
  requestId: string;
}) {
  const phone = normalizePhone(input.phone);
  const code = normalizeSmsCode(input.code);
  const repository = getRepository();
  const now = new Date().toISOString();
  const smsCode = await repository.findSmsCodeForVerification(phone, "login", code, now);

  if (!smsCode) {
    throw new ApiError("VALIDATION_ERROR", "验证码不正确或已过期", 400);
  }

  await repository.markSmsCodeUsed(smsCode.id, now);

  const existingUser = await repository.findUserByPhone(phone);
  const user = existingUser ? await repository.updateUserLastLogin(existingUser.id, now) : await createUser(phone, input.inviteCode, now);

  if (user.status !== "active") {
    throw new ApiError("FORBIDDEN", "当前账号不可用", 403);
  }

  const appliedBonus = await ensureSignupBonus(user.id, input.requestId);

  return {
    user: toUserResponse(user),
    creditAccount: toCreditAccountResponse(appliedBonus.account),
    isNewUser: !existingUser,
    signupBonusGranted: !appliedBonus.duplicated
  };
}

export async function getCurrentUserProfile(userId: string) {
  const repository = getRepository();
  const user = await repository.findUserById(userId);

  if (!user || user.status !== "active") {
    throw new ApiError("UNAUTHORIZED", "请先登录", 401);
  }

  const account = await repository.ensureCreditAccount(user.id, new Date().toISOString());

  return {
    user: toUserResponse(user),
    creditAccount: toCreditAccountResponse(account)
  };
}

export function toUserResponse(user: User) {
  return {
    id: user.id,
    phone: maskPhone(user.phone),
    displayName: user.displayName,
    inviteCode: user.inviteCode,
    status: user.status,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt
  };
}

async function createUser(phone: string, inviteCode: string | undefined, now: string) {
  const repository = getRepository();
  const referredBy = await resolveReferredBy(inviteCode);

  return repository.createUser({
    phone,
    displayName: `量化探索者${phone.slice(-4)}`,
    inviteCode: createInviteCode(),
    referredBy,
    createdAt: now,
    lastLoginAt: now
  });
}

async function resolveReferredBy(inviteCode: string | undefined) {
  const normalized = inviteCode?.trim();

  if (!normalized) {
    return null;
  }

  const referredUser = await getRepository().findUserByInviteCode(normalized);

  if (!referredUser) {
    throw new ApiError("VALIDATION_ERROR", "邀请码不存在", 400);
  }

  return referredUser.id;
}

function normalizePhone(phone: string) {
  const value = phone.trim();

  if (!PHONE_PATTERN.test(value)) {
    throw new ApiError("VALIDATION_ERROR", "请输入有效的手机号", 400);
  }

  return value;
}

function normalizeSmsCode(code: string) {
  const value = code.trim();

  if (!/^\d{6}$/.test(value)) {
    throw new ApiError("VALIDATION_ERROR", "请输入 6 位验证码", 400);
  }

  return value;
}

function createInviteCode() {
  return randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
}

function maskPhone(phone: string) {
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}

