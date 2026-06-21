import { createHash, randomInt, randomUUID } from "crypto";
import type { SmsCodeRecord, SmsScene, User } from "@/server/domain";
import { getAliyunSmsConfig, getAuthSecret, getSmsProviderMode, getTencentSmsConfig, shouldExposeMockSmsCode } from "@/server/env";
import { applyInviteBonus, ensureSignupBonus, INVITE_BONUS_POINTS, toCreditAccountResponse } from "@/server/credits/credit-service";
import { checkAliyunSmsCode, sendAliyunSmsCode } from "@/server/auth/aliyun-sms-provider";
import { sendTencentSmsCode } from "@/server/auth/tencent-sms-provider";
import { ApiError } from "@/server/http/api-response";
import { getMembershipProfileForUser, grantBetaVipForRegistration } from "@/server/memberships/beta-membership-service";
import { getRepository, withRepositoryTransaction } from "@/server/repositories";

const MOCK_SMS_CODE = "123456";
const SMS_CODE_TTL_MINUTES = 10;
const PHONE_PATTERN = /^1[3-9]\d{9}$/;
const CURRENT_AGREEMENT_VERSION = "2026-06-09";
const CURRENT_PRIVACY_VERSION = "2026-06-09";
const ALIYUN_SMS_CODE_HASH_PREFIX = "aliyun:";
const TENCENT_SMS_CODE_HASH_PREFIX = "tencent:";
const INVALID_SMS_CODE_MESSAGE = "验证码不正确或已过期";
type InviteRewardResponse = {
  granted: boolean;
  inviterUserId: string | null;
  points: number;
  duplicated: boolean;
};

const EMPTY_INVITE_REWARD: InviteRewardResponse = {
  granted: false,
  inviterUserId: null,
  points: 0,
  duplicated: false
};

export async function requestSmsCode(input: { phone: string; scene?: SmsScene; requestIp: string | null }) {
  const phone = normalizePhone(input.phone);
  const scene = input.scene ?? "login";
  const now = new Date();
  const repository = getRepository();
  const provider = getSmsProviderMode();

  if (provider === "aliyun") {
    const outId = createAliyunSmsOutId();
    const expiresAt = getAliyunSmsExpiresAt();
    const record = await repository.createSmsCode({
      phone,
      scene,
      codeHash: createAliyunSmsCodeHash(outId),
      mockCode: null,
      expiresAt,
      requestIp: input.requestIp,
      createdAt: now.toISOString()
    });

    await sendAliyunSmsCode(phone, outId);

    return {
      phone: record.phone,
      scene: record.scene,
      expiresAt: record.expiresAt
    };
  }

  if (provider === "tencent") {
    const code = createNumericSmsCode(getTencentSmsConfig().codeLength);
    const outId = createTencentSmsOutId();
    const expiresAt = getTencentSmsExpiresAt();
    const record = await repository.createSmsCode({
      phone,
      scene,
      codeHash: createTencentSmsCodeHash(phone, code),
      mockCode: null,
      expiresAt,
      requestIp: input.requestIp,
      createdAt: now.toISOString()
    });

    await sendTencentSmsCode({
      phone,
      code,
      outId
    });

    return {
      phone: record.phone,
      scene: record.scene,
      expiresAt: record.expiresAt
    };
  }

  const expiresAt = new Date(now.getTime() + SMS_CODE_TTL_MINUTES * 60 * 1000).toISOString();
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
  acceptedLegal: boolean;
  requestIp: string | null;
  userAgent: string | null;
}) {
  if (!input.acceptedLegal) {
    throw new ApiError("LEGAL_AGREEMENT_REQUIRED", "请先阅读并同意用户协议和隐私政策", 400);
  }

  const phone = normalizePhone(input.phone);
  const code = normalizeSmsCode(input.code);
  const smsProvider = getSmsProviderMode();
  const verifiedAliyunSmsCode = smsProvider === "aliyun" ? await verifyAliyunLoginSmsCode(phone, code) : null;
  const verifiedTencentSmsCode = smsProvider === "tencent" ? await verifyTencentLoginSmsCode(phone, code) : null;

  return withRepositoryTransaction(async () => {
    const repository = getRepository();
    const now = new Date().toISOString();
    const smsCode =
      smsProvider === "aliyun"
        ? await repository.findLatestSmsCodeForVerification(phone, "login", now)
        : smsProvider === "tencent"
          ? await repository.findLatestSmsCodeForVerification(phone, "login", now)
        : await repository.findSmsCodeForVerification(phone, "login", code, now);

    if (
      !smsCode ||
      (verifiedAliyunSmsCode && smsCode.id !== verifiedAliyunSmsCode.id) ||
      (verifiedTencentSmsCode && smsCode.id !== verifiedTencentSmsCode.id)
    ) {
      throw new ApiError("VALIDATION_ERROR", INVALID_SMS_CODE_MESSAGE, 400);
    }

    await repository.markSmsCodeUsed(smsCode.id, now);

    const existingUser = await repository.findUserByPhone(phone);
    const isNewUser = !existingUser;
    const user = existingUser ? await repository.updateUserLastLogin(existingUser.id, now) : await createUser(phone, input.inviteCode, now);

    if (user.status !== "active") {
      throw new ApiError("FORBIDDEN", "当前账号不可用", 403);
    }

    if (isNewUser) {
      await repository.createUserLegalConsent({
        userId: user.id,
        agreementVersion: CURRENT_AGREEMENT_VERSION,
        privacyVersion: CURRENT_PRIVACY_VERSION,
        agreedAt: now,
        requestIp: input.requestIp,
        userAgent: normalizeUserAgent(input.userAgent),
        source: "signup"
      });
      await grantBetaVipForRegistration(user.id, now);
    }

    const signupBonusResult = isNewUser ? await ensureSignupBonus(user.id, input.requestId) : null;
    const inviteReward =
      isNewUser && user.referredBy
        ? await grantInviteReward({
            inviterUserId: user.referredBy,
            newUserId: user.id,
            requestId: input.requestId
          })
        : EMPTY_INVITE_REWARD;
    const creditAccount = signupBonusResult?.account ?? await repository.ensureCreditAccount(user.id, now);
    const membership = await getMembershipProfileForUser(user.id, now);

    return {
      user: toUserResponse(user),
      creditAccount: toCreditAccountResponse(creditAccount),
      membership,
      isNewUser,
      signupBonusGranted: signupBonusResult ? !signupBonusResult.duplicated : false,
      inviteReward
    };
  });
}

async function verifyAliyunLoginSmsCode(phone: string, code: string) {
  const repository = getRepository();
  const now = new Date().toISOString();
  const smsCode = await repository.findLatestSmsCodeForVerification(phone, "login", now);
  const outId = smsCode ? getAliyunSmsCodeOutId(smsCode) : null;

  if (!smsCode || !outId) {
    throw new ApiError("VALIDATION_ERROR", INVALID_SMS_CODE_MESSAGE, 400);
  }

  const verified = await checkAliyunSmsCode({
    phone,
    code,
    outId
  });

  if (!verified) {
    throw new ApiError("VALIDATION_ERROR", INVALID_SMS_CODE_MESSAGE, 400);
  }

  return smsCode;
}

async function verifyTencentLoginSmsCode(phone: string, code: string) {
  const repository = getRepository();
  const now = new Date().toISOString();
  const smsCode = await repository.findLatestSmsCodeForVerification(phone, "login", now);

  if (!smsCode || smsCode.codeHash !== createTencentSmsCodeHash(phone, code)) {
    throw new ApiError("VALIDATION_ERROR", INVALID_SMS_CODE_MESSAGE, 400);
  }

  return smsCode;
}

export async function getCurrentUserProfile(userId: string) {
  const repository = getRepository();
  const user = await repository.findUserById(userId);

  if (!user || user.status !== "active") {
    throw new ApiError("UNAUTHORIZED", "请先登录", 401);
  }

  const now = new Date().toISOString();
  const account = await repository.ensureCreditAccount(user.id, now);
  const membership = await getMembershipProfileForUser(user.id, now);

  return {
    user: toUserResponse(user),
    creditAccount: toCreditAccountResponse(account),
    membership
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
  const referredBy = await resolveReferredBy(inviteCode, phone);

  return repository.createUser({
    phone,
    displayName: `量化探索者${phone.slice(-4)}`,
    inviteCode: createInviteCode(),
    referredBy,
    createdAt: now,
    lastLoginAt: now
  });
}

async function resolveReferredBy(inviteCode: string | undefined, phone: string) {
  const normalized = inviteCode?.trim();

  if (!normalized) {
    return null;
  }

  const referredUser = await getRepository().findUserByInviteCode(normalized);

  if (!referredUser) {
    throw new ApiError("VALIDATION_ERROR", "邀请码不存在，可清空后继续注册", 400);
  }

  if (referredUser.phone === phone) {
    throw new ApiError("VALIDATION_ERROR", "不能使用自己的邀请码", 400);
  }

  return referredUser.id;
}

async function grantInviteReward(input: { inviterUserId: string; newUserId: string; requestId: string }): Promise<InviteRewardResponse> {
  if (input.inviterUserId === input.newUserId) {
    throw new ApiError("VALIDATION_ERROR", "不能使用自己的邀请码", 400);
  }

  const result = await applyInviteBonus(input);

  return {
    granted: !result.duplicated,
    inviterUserId: input.inviterUserId,
    points: INVITE_BONUS_POINTS,
    duplicated: result.duplicated
  };
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

function createAliyunSmsCodeHash(outId: string) {
  return `${ALIYUN_SMS_CODE_HASH_PREFIX}${outId}`;
}

function createAliyunSmsOutId() {
  return `lq_${randomUUID()}`;
}

function createTencentSmsOutId() {
  return `lq_${randomUUID()}`;
}

function getAliyunSmsExpiresAt() {
  return new Date(Date.now() + getAliyunSmsConfig().validTimeSeconds * 1000).toISOString();
}

function getTencentSmsExpiresAt() {
  return new Date(Date.now() + getTencentSmsConfig().validTimeSeconds * 1000).toISOString();
}

function createNumericSmsCode(length: number) {
  return String(randomInt(0, 10 ** length)).padStart(length, "0");
}

function createTencentSmsCodeHash(phone: string, code: string) {
  const digest = createHash("sha256").update(`${phone}:${code}:${getAuthSecret()}`).digest("hex");

  return `${TENCENT_SMS_CODE_HASH_PREFIX}${digest}`;
}

function getAliyunSmsCodeOutId(smsCode: SmsCodeRecord) {
  const value = smsCode.codeHash;

  if (!value?.startsWith(ALIYUN_SMS_CODE_HASH_PREFIX)) {
    return null;
  }

  return value.slice(ALIYUN_SMS_CODE_HASH_PREFIX.length) || null;
}

function normalizeUserAgent(userAgent: string | null) {
  const value = userAgent?.trim();

  return value ? value.slice(0, 512) : null;
}

function maskPhone(phone: string) {
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}
