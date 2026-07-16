import { randomUUID } from "crypto";
import type {
  AiTask,
  AiConversation,
  AiMessage,
  AiMessageAttachment,
  AiMessageAttachmentSummary,
  AiRunEvent,
  AiTaskResult,
  AiModelProfile,
  AiModelSecret,
  ContactRequest,
  CreditAccount,
  CreditGrant,
  CreditLedger,
  CreditReservation,
  PaymentTransaction,
  RechargeOrder,
  RechargePlan,
  SmsCodeRecord,
  UploadedFile,
  User,
  UserLegalConsent,
  UserMembership,
  WechatGroupQrCode
} from "@/server/domain";
import { ApiError } from "@/server/http/api-response";
import { assertIdempotentCreditLedgerMatches } from "@/server/credits/credit-idempotency";
import { getOrderExpiresAt, isOrderExpired } from "@/server/payments/payment-config";
import type {
  AiTaskPage,
  AdminCreditLedgerFilters,
  AdminCreditLedgerPage,
  AdminContactRequestFilters,
  AdminContactRequestPage,
  AdminAiTaskPage,
  AdminOrderFilters,
  AdminOrderPage,
  AdminOverview,
  AdminUploadedFilePage,
  AdminUserFilters,
  AdminUserPage,
  AiConversationPagination,
  AiMessageListOptions,
  AppliedCreditLedger,
  ApplyAdminCreditAdjustmentInput,
  ApplyCreditLedgerInput,
  CreateAdminAuditLogInput,
  CreateAndActivateWechatGroupQrCodeInput,
  CreateAiModelProfileInput,
  CreateContactRequestInput,
  CreateAiTaskInput,
  CreateAiConversationInput,
  CreateAiMessageAttachmentInput,
  CreateAiMessageInput,
  CreateAiRunEventInput,
  CreateAiTaskResultInput,
  CreateCreditReservationInput,
  CreatePaymentTransactionInput,
  CreateRechargeOrderInput,
  CreateSmsCodeInput,
  CreateUploadedFileInput,
  CreateUserLegalConsentInput,
  CreateUserInput,
  CreditLedgerFilters,
  LedgerPage,
  LightQuantRepository,
  SetActiveAiModelProfileInput,
  UpdateAiModelProfileEnabledInput,
  UpdateAiModelProfileInput,
  UpsertUserMembershipInput,
  UpsertAiModelSecretInput,
  UpdateAiConversationInput,
  UpdateAiTaskInput
} from "@/server/repositories/types";

const MOCK_PLAN_TIMESTAMP = "2026-01-01T00:00:00.000Z";

function matchesCreditLedgerFilters(item: CreditLedger, filters: CreditLedgerFilters) {
  if (filters.category === "income" && (item.direction !== "in" || item.type === "refund")) {
    return false;
  }

  if (filters.category === "consume" && item.direction !== "out") {
    return false;
  }

  if (filters.category === "refund" && item.type !== "refund") {
    return false;
  }

  if (filters.createdFrom && item.createdAt < filters.createdFrom) {
    return false;
  }

  if (filters.createdToExclusive && item.createdAt >= filters.createdToExclusive) {
    return false;
  }

  return true;
}

const mockRechargePlans: RechargePlan[] = [
  {
    id: "promo",
    name: "特惠",
    description: "每个账号限购一次。",
    planType: "permanent",
    validityDays: null,
    purchaseLimit: 1,
    priceCents: 990,
    points: 900,
    bonusPoints: 0,
    totalPoints: 900,
    enabled: true,
    sort: 10,
    createdAt: MOCK_PLAN_TIMESTAMP,
    updatedAt: MOCK_PLAN_TIMESTAMP
  },
  {
    id: "monthly_plus",
    name: "月卡 Plus",
    description: "30 天内有效。",
    planType: "monthly",
    validityDays: 30,
    purchaseLimit: null,
    priceCents: 5800,
    points: 6000,
    bonusPoints: 0,
    totalPoints: 6000,
    enabled: true,
    sort: 20,
    createdAt: MOCK_PLAN_TIMESTAMP,
    updatedAt: MOCK_PLAN_TIMESTAMP
  },
  {
    id: "monthly_pro",
    name: "月卡 Pro",
    description: "30 天内有效。",
    planType: "monthly",
    validityDays: 30,
    purchaseLimit: null,
    priceCents: 8800,
    points: 10000,
    bonusPoints: 0,
    totalPoints: 10000,
    enabled: true,
    sort: 30,
    createdAt: MOCK_PLAN_TIMESTAMP,
    updatedAt: MOCK_PLAN_TIMESTAMP
  },
  {
    id: "points_plus",
    name: "基础积分包 Plus",
    description: "基础积分包。",
    planType: "permanent",
    validityDays: null,
    purchaseLimit: null,
    priceCents: 9900,
    points: 7000,
    bonusPoints: 0,
    totalPoints: 7000,
    enabled: true,
    sort: 40,
    createdAt: MOCK_PLAN_TIMESTAMP,
    updatedAt: MOCK_PLAN_TIMESTAMP
  },
  {
    id: "points_pro",
    name: "基础积分包 Pro",
    description: "基础积分包。",
    planType: "permanent",
    validityDays: null,
    purchaseLimit: null,
    priceCents: 19900,
    points: 17000,
    bonusPoints: 0,
    totalPoints: 17000,
    enabled: true,
    sort: 50,
    createdAt: MOCK_PLAN_TIMESTAMP,
    updatedAt: MOCK_PLAN_TIMESTAMP
  }
];
export class MockLightQuantRepository implements LightQuantRepository {
  private readonly users = new Map<string, User>();
  private readonly usersByPhone = new Map<string, string>();
  private readonly usersByInviteCode = new Map<string, string>();
  private readonly legalConsents = new Map<string, UserLegalConsent>();
  private readonly legalConsentsByVersion = new Map<string, string>();
  private readonly userMemberships = new Map<string, UserMembership>();
  private readonly userMembershipsBySource = new Map<string, string>();
  private readonly smsCodes = new Map<string, SmsCodeRecord>();
  private readonly creditAccounts = new Map<string, CreditAccount>();
  private readonly creditGrants = new Map<string, CreditGrant>();
  private readonly creditLedger = new Map<string, CreditLedger>();
  private readonly ledgerByIdempotencyKey = new Map<string, string>();
  private readonly rechargePlans = new Map<string, RechargePlan>(mockRechargePlans.map((plan) => [plan.id, plan]));
  private readonly orders = new Map<string, RechargeOrder>();
  private readonly ordersByOrderNo = new Map<string, string>();
  private readonly ordersByClientRequestId = new Map<string, string>();
  private readonly paymentTransactions = new Map<string, PaymentTransaction>();
  private readonly paymentTransactionsByIdempotencyKey = new Map<string, string>();
  private readonly aiTasks = new Map<string, AiTask>();
  private readonly aiTasksByClientRequestId = new Map<string, string>();
  private readonly aiTaskResults = new Map<string, AiTaskResult>();
  private readonly aiConversations = new Map<string, AiConversation>();
  private readonly aiMessages = new Map<string, AiMessage>();
  private readonly aiMessagesByTaskId = new Map<string, string>();
  private readonly aiMessageAttachments = new Map<string, AiMessageAttachment>();
  private readonly aiRunEvents = new Map<string, AiRunEvent>();
  private readonly uploadedFiles = new Map<string, UploadedFile>();
  private readonly contactRequests = new Map<string, ContactRequest>();
  private readonly wechatGroupQrCodes = new Map<string, WechatGroupQrCode>();
  private readonly aiModelProfiles = new Map<string, AiModelProfile>();
  private readonly aiModelSecrets = new Map<string, AiModelSecret>();
  private activeAiModelProfileId: string | null = null;
  private readonly creditReservations = new Map<string, CreditReservation>();
  private readonly creditReservationsByIdempotencyKey = new Map<string, string>();
  private readonly creditReservationsByTaskId = new Map<string, string>();
  private readonly adminAuditLogs = new Map<string, CreateAdminAuditLogInput & { id: string }>();

  async createSmsCode(input: CreateSmsCodeInput) {
    const record: SmsCodeRecord = {
      id: randomUUID(),
      ...input,
      usedAt: null,
      failedAttempts: 0,
      lastFailedAt: null
    };

    this.smsCodes.set(record.id, record);
    return record;
  }

  async countSmsCodesByPhoneSceneSince(phone: string, scene: SmsCodeRecord["scene"], since: string) {
    return [...this.smsCodes.values()]
      .filter((item) => item.phone === phone && item.scene === scene && item.createdAt >= since)
      .length;
  }

  async countSmsCodesByRequestIpSince(requestIp: string, since: string) {
    return [...this.smsCodes.values()]
      .filter((item) => item.requestIp === requestIp && item.createdAt >= since)
      .length;
  }

  async findSmsCodeForVerification(phone: string, scene: SmsCodeRecord["scene"], code: string, now: string) {
    const matched = [...this.smsCodes.values()]
      .filter((item) => item.phone === phone && item.scene === scene && !item.usedAt && item.expiresAt > now)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .find((item) => item.mockCode === code);

    return matched ?? null;
  }

  async findLatestSmsCodeForVerification(phone: string, scene: SmsCodeRecord["scene"], now: string) {
    return [...this.smsCodes.values()]
      .filter((item) => item.phone === phone && item.scene === scene && !item.usedAt && item.expiresAt > now)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0] ?? null;
  }

  async markSmsCodeVerificationFailed(input: { id: string; failedAt: string; resetBefore: string }) {
    const record = this.smsCodes.get(input.id);

    if (!record) {
      return null;
    }

    const shouldReset = !record.lastFailedAt || record.lastFailedAt <= input.resetBefore;
    const updated = {
      ...record,
      failedAttempts: shouldReset ? 1 : record.failedAttempts + 1,
      lastFailedAt: input.failedAt
    };

    this.smsCodes.set(input.id, updated);
    return updated;
  }

  async markSmsCodeUsed(id: string, usedAt: string) {
    const record = this.smsCodes.get(id);

    if (record) {
      this.smsCodes.set(id, {
        ...record,
        usedAt
      });
    }
  }

  async findUserById(id: string) {
    return this.users.get(id) ?? null;
  }

  async findUserByPhone(phone: string) {
    const userId = this.usersByPhone.get(phone);
    return userId ? this.findUserById(userId) : null;
  }

  async findUserByInviteCode(inviteCode: string) {
    const userId = this.usersByInviteCode.get(inviteCode);
    return userId ? this.findUserById(userId) : null;
  }

  async createUser(input: CreateUserInput) {
    const user: User = {
      id: randomUUID(),
      status: "active",
      ...input
    };

    this.users.set(user.id, user);
    this.usersByPhone.set(user.phone, user.id);
    this.usersByInviteCode.set(user.inviteCode, user.id);

    return user;
  }

  async createUserLegalConsent(input: CreateUserLegalConsentInput) {
    const key = legalConsentKey(input.userId, input.agreementVersion, input.privacyVersion);
    const existingId = this.legalConsentsByVersion.get(key);
    const existing = existingId ? this.legalConsents.get(existingId) : null;

    if (existing) {
      return existing;
    }

    const consent: UserLegalConsent = {
      id: randomUUID(),
      ...input
    };

    this.legalConsents.set(consent.id, consent);
    this.legalConsentsByVersion.set(key, consent.id);

    return consent;
  }

  async createContactRequest(input: CreateContactRequestInput) {
    const request: ContactRequest = {
      id: randomUUID(),
      ...input
    };

    this.contactRequests.set(request.id, request);
    return request;
  }

  async countContactRequestsByUserSince(userId: string, since: string) {
    return [...this.contactRequests.values()]
      .filter((request) => request.userId === userId && request.createdAt >= since)
      .length;
  }

  async countContactRequestsByRequestIpSince(requestIp: string, since: string) {
    return [...this.contactRequests.values()]
      .filter((request) => request.requestIp === requestIp && request.createdAt >= since)
      .length;
  }

  async getActiveWechatGroupQrCode() {
    return [...this.wechatGroupQrCodes.values()]
      .filter((qrCode) => qrCode.status === "active")
      .sort((left, right) => right.activatedAt.localeCompare(left.activatedAt))[0] ?? null;
  }

  async findWechatGroupQrCodeById(id: string) {
    return this.wechatGroupQrCodes.get(id) ?? null;
  }

  async listAdminWechatGroupQrCodes(limit: number) {
    return [...this.wechatGroupQrCodes.values()]
      .sort((left, right) => right.activatedAt.localeCompare(left.activatedAt) || right.createdAt.localeCompare(left.createdAt))
      .slice(0, Math.max(1, Math.min(100, limit)));
  }

  async createAndActivateWechatGroupQrCode(input: CreateAndActivateWechatGroupQrCodeInput) {
    for (const qrCode of this.wechatGroupQrCodes.values()) {
      if (qrCode.status === "active") {
        this.wechatGroupQrCodes.set(qrCode.id, {
          ...qrCode,
          status: "archived"
        });
      }
    }

    const next: WechatGroupQrCode = {
      ...input,
      status: "active"
    };

    this.wechatGroupQrCodes.set(next.id, next);
    return next;
  }

  async updateUserLastLogin(userId: string, lastLoginAt: string) {
    const user = this.users.get(userId);

    if (!user) {
      throw new Error("User not found");
    }

    const updated = {
      ...user,
      lastLoginAt
    };

    this.users.set(userId, updated);
    return updated;
  }

  async listAiModelProfiles() {
    return [...this.aiModelProfiles.values()]
      .sort((left, right) => Number(right.enabled) - Number(left.enabled) || right.updatedAt.localeCompare(left.updatedAt));
  }

  async findAiModelProfileById(profileId: string) {
    return this.aiModelProfiles.get(profileId) ?? null;
  }

  async createAiModelProfile(input: CreateAiModelProfileInput) {
    const profile: AiModelProfile = {
      id: randomUUID(),
      ...input
    };

    this.aiModelProfiles.set(profile.id, profile);
    return profile;
  }

  async updateAiModelProfile(input: UpdateAiModelProfileInput) {
    const profile = this.aiModelProfiles.get(input.profileId);

    if (!profile) {
      throw new ApiError("NOT_FOUND", "模型配置不存在", 404);
    }

    const updated: AiModelProfile = {
      ...profile,
      name: input.name,
      provider: input.provider,
      baseUrl: input.baseUrl,
      model: input.model,
      supportsVision: input.supportsVision,
      apiKeyEnvName: input.apiKeyEnvName,
      apiKeySecretId: input.apiKeySecretId,
      enabled: input.enabled,
      updatedAt: input.updatedAt
    };

    this.aiModelProfiles.set(updated.id, updated);
    return updated;
  }

  async updateAiModelProfileEnabled(input: UpdateAiModelProfileEnabledInput) {
    const profile = this.aiModelProfiles.get(input.profileId);

    if (!profile) {
      throw new ApiError("NOT_FOUND", "模型配置不存在", 404);
    }

    const updated: AiModelProfile = {
      ...profile,
      enabled: input.enabled,
      updatedAt: input.updatedAt
    };

    this.aiModelProfiles.set(updated.id, updated);
    return updated;
  }

  async getActiveAiModelProfile() {
    return this.activeAiModelProfileId ? this.aiModelProfiles.get(this.activeAiModelProfileId) ?? null : null;
  }

  async setActiveAiModelProfile(input: SetActiveAiModelProfileInput) {
    const profile = this.aiModelProfiles.get(input.profileId);

    if (!profile) {
      throw new ApiError("NOT_FOUND", "模型配置不存在", 404);
    }

    this.activeAiModelProfileId = profile.id;
    return profile;
  }

  async listAiModelSecrets() {
    return [...this.aiModelSecrets.values()].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  async findAiModelSecretById(secretId: string) {
    return this.aiModelSecrets.get(secretId) ?? null;
  }

  async upsertAiModelSecret(input: UpsertAiModelSecretInput) {
    const existing = input.secretId ? this.aiModelSecrets.get(input.secretId) : null;
    const secret: AiModelSecret = existing
      ? {
          ...existing,
          name: input.name,
          provider: input.provider,
          encryptedValue: input.encryptedValue,
          keyHint: input.keyHint,
          updatedAt: input.updatedAt
        }
      : {
          id: randomUUID(),
          name: input.name,
          provider: input.provider,
          encryptedValue: input.encryptedValue,
          keyHint: input.keyHint,
          createdAt: input.createdAt,
          updatedAt: input.updatedAt
        };

    this.aiModelSecrets.set(secret.id, secret);
    return secret;
  }

  async findActiveMembershipForUser(userId: string, type: UserMembership["type"], at: string) {
    return [...this.userMemberships.values()]
      .filter((membership) =>
        membership.userId === userId &&
        membership.type === type &&
        membership.status === "active" &&
        membership.startsAt <= at &&
        membership.endsAt >= at
      )
      .sort((left, right) => right.endsAt.localeCompare(left.endsAt))[0] ?? null;
  }

  async upsertUserMembership(input: UpsertUserMembershipInput) {
    const key = userMembershipSourceKey(input.userId, input.type, input.sourceType, input.sourceId);
    const existingId = this.userMembershipsBySource.get(key);
    const existing = existingId ? this.userMemberships.get(existingId) : null;

    if (existing) {
      const updated: UserMembership = {
        ...existing,
        status: input.status,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        updatedAt: input.updatedAt
      };

      this.userMemberships.set(updated.id, updated);
      return updated;
    }

    const membership: UserMembership = {
      id: randomUUID(),
      ...input
    };

    this.userMemberships.set(membership.id, membership);
    this.userMembershipsBySource.set(key, membership.id);

    return membership;
  }

  async getCreditAccount(userId: string) {
    return this.creditAccounts.get(userId) ?? null;
  }

  async ensureCreditAccount(userId: string, now: string) {
    const existing = this.creditAccounts.get(userId);

    if (existing) {
      return existing;
    }

    const account: CreditAccount = {
      userId,
      balance: 0,
      totalEarned: 0,
      totalSpent: 0,
      version: 0,
      updatedAt: now,
      monthlyBalance: 0,
      permanentBalance: 0,
      monthlyPlanId: null,
      monthlyPlanName: null,
      monthlyExpiresAt: null
    };

    this.creditAccounts.set(userId, account);
    return account;
  }

  async getCreditGrantSummary(userId: string, now: string) {
    const activeGrants = [...this.creditGrants.values()]
      .filter((grant) => grant.userId === userId && grant.remainingAmount > 0);
    const monthlyGrants = activeGrants
      .filter((grant) => grant.grantType === "monthly" && grant.expiresAt && grant.expiresAt > now)
      .sort((left, right) => (left.expiresAt ?? "").localeCompare(right.expiresAt ?? ""));
    const activeMonthlyCard = await this.getActiveMonthlyCardForUser(userId, now);

    return {
      monthlyBalance: monthlyGrants.reduce((total, grant) => total + grant.remainingAmount, 0),
      permanentBalance: activeGrants
        .filter((grant) => grant.grantType === "permanent")
        .reduce((total, grant) => total + grant.remainingAmount, 0),
      monthlyPlanId: activeMonthlyCard?.planId ?? null,
      monthlyPlanName: activeMonthlyCard?.planName ?? null,
      monthlyExpiresAt: activeMonthlyCard?.expiresAt ?? monthlyGrants[0]?.expiresAt ?? null
    };
  }

  async getActiveMonthlyCardForUser(userId: string, now: string, exceptOrderId?: string) {
    const grant = [...this.creditGrants.values()]
      .filter((item) =>
        item.userId === userId &&
        item.grantType === "monthly" &&
        item.remainingAmount > 0 &&
        item.sourceId !== exceptOrderId &&
        item.expiresAt !== null &&
        item.expiresAt > now
      )
      .sort((left, right) => (left.expiresAt ?? "").localeCompare(right.expiresAt ?? ""))[0] ?? null;

    return this.getActiveMonthlyCardFromGrant(grant, userId);
  }

  private getActiveMonthlyCardFromGrant(grant: CreditGrant | null, userId: string) {
    if (!grant?.expiresAt) {
      return null;
    }

    const order = this.findMonthlyRechargeOrderForGrant(grant, userId);
    const plan = order ? this.rechargePlans.get(order.planId) : null;

    if (!plan || plan.planType !== "monthly") {
      return null;
    }

    return {
      planId: plan.id,
      planName: plan.name,
      expiresAt: grant.expiresAt
    };
  }

  private findMonthlyRechargeOrderForGrant(grant: CreditGrant, userId: string) {
    if (!grant.expiresAt) {
      return null;
    }

    const directOrder = this.orders.get(grant.sourceId);

    if (directOrder?.userId === userId && this.rechargePlans.get(directOrder.planId)?.planType === "monthly") {
      return directOrder;
    }

    const ledger = [...this.creditLedger.values()]
      .filter((item) => item.userId === userId && item.type === "recharge" && item.direction === "in" && item.sourceType === "recharge" && item.sourceId === grant.sourceId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];
    const ledgerOrder = ledger ? this.orders.get(ledger.sourceId) : null;

    if (ledgerOrder?.userId === userId && this.rechargePlans.get(ledgerOrder.planId)?.planType === "monthly") {
      return ledgerOrder;
    }

    const expiresAt = grant.expiresAt;
    const startsAt = new Date(new Date(expiresAt).getTime() - 31 * 24 * 60 * 60 * 1000).toISOString();

    return [...this.orders.values()]
      .filter((order) =>
        order.userId === userId &&
        order.status === "PAID" &&
        (order.planId === "monthly_plus" || order.planId === "monthly_pro") &&
        (order.paidAt ?? order.createdAt) <= expiresAt &&
        (order.paidAt ?? order.createdAt) >= startsAt
      )
      .sort((left, right) => (right.paidAt ?? right.createdAt).localeCompare(left.paidAt ?? left.createdAt))[0] ?? null;
  }

  async expireCreditGrantsForUser(userId: string, now: string, requestId: string) {
    const expiredGrants = [...this.creditGrants.values()]
      .filter((grant) => grant.userId === userId && grant.grantType === "monthly" && grant.remainingAmount > 0 && grant.expiresAt && grant.expiresAt <= now)
      .sort((left, right) => (left.expiresAt ?? "").localeCompare(right.expiresAt ?? ""));

    for (const grant of expiredGrants) {
      const idempotencyKey = `credit_grant_expire:${grant.id}`;

      if (this.ledgerByIdempotencyKey.has(idempotencyKey)) {
        this.creditGrants.set(grant.id, {
          ...grant,
          remainingAmount: 0,
          updatedAt: now
        });
        continue;
      }

      const previousAccount = await this.ensureCreditAccount(userId, now);
      const account: CreditAccount = {
        ...previousAccount,
        balance: Math.max(0, previousAccount.balance - grant.remainingAmount),
        version: previousAccount.version + 1,
        updatedAt: now
      };
      const ledger: CreditLedger = {
        id: randomUUID(),
        userId,
        requestId,
        scene: "monthly_expire",
        type: "consume",
        direction: "out",
        amount: grant.remainingAmount,
        balanceAfter: account.balance,
        status: "posted",
        sourceType: "credit_grant",
        sourceId: grant.id,
        idempotencyKey,
        remark: `月卡积分过期：${grant.remainingAmount.toLocaleString("zh-CN")} 积分`,
        createdAt: now
      };

      this.creditAccounts.set(userId, account);
      this.creditGrants.set(grant.id, {
        ...grant,
        remainingAmount: 0,
        updatedAt: now
      });
      this.creditLedger.set(ledger.id, ledger);
      this.ledgerByIdempotencyKey.set(idempotencyKey, ledger.id);
    }
  }

  async applyCreditLedger(input: ApplyCreditLedgerInput): Promise<AppliedCreditLedger> {
    const existingLedgerId = this.ledgerByIdempotencyKey.get(input.idempotencyKey);

    if (existingLedgerId) {
      const ledger = this.creditLedger.get(existingLedgerId);

      if (ledger) {
        assertIdempotentCreditLedgerMatches(ledger, input);
        const account = await this.ensureCreditAccount(input.userId, input.createdAt);

        return {
          account,
          ledger,
          duplicated: true
        };
      }
    }

    if (input.direction === "out") {
      return this.applyCreditConsumption(input);
    }

    const previousAccount = await this.ensureCreditAccount(input.userId, input.createdAt);
    const signedAmount = input.direction === "in" ? input.amount : -input.amount;
    const account: CreditAccount = {
      ...previousAccount,
      balance: previousAccount.balance + signedAmount,
      totalEarned: previousAccount.totalEarned + input.amount,
      totalSpent: previousAccount.totalSpent,
      version: previousAccount.version + 1,
      updatedAt: input.createdAt
    };
    const ledger: CreditLedger = {
      id: randomUUID(),
      status: "posted",
      balanceAfter: account.balance,
      ...input
    };

    this.creditAccounts.set(input.userId, account);
    this.creditLedger.set(ledger.id, ledger);
    this.ledgerByIdempotencyKey.set(ledger.idempotencyKey, ledger.id);
    const grantId = randomUUID();
    this.creditGrants.set(grantId, {
      id: grantId,
      userId: input.userId,
      grantType: input.grantType ?? "permanent",
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      initialAmount: input.amount,
      remainingAmount: input.amount,
      expiresAt: input.grantExpiresAt ?? null,
      createdAt: input.createdAt,
      updatedAt: input.createdAt
    });

    return {
      account,
      ledger,
      duplicated: false
    };
  }

  private async applyCreditConsumption(input: ApplyCreditLedgerInput): Promise<AppliedCreditLedger> {
    const previousAccount = await this.ensureCreditAccount(input.userId, input.createdAt);
    const grants = [...this.creditGrants.values()]
      .filter((grant) =>
        grant.userId === input.userId &&
        grant.remainingAmount > 0 &&
        (grant.grantType === "permanent" || (grant.expiresAt !== null && grant.expiresAt > input.createdAt))
      )
      .sort((left, right) =>
        left.grantType.localeCompare(right.grantType) ||
        (left.expiresAt ?? "9999").localeCompare(right.expiresAt ?? "9999") ||
        left.createdAt.localeCompare(right.createdAt)
      );
    const available = grants.reduce((total, grant) => total + grant.remainingAmount, 0);

    if (available < input.amount || previousAccount.balance < input.amount) {
      throw new ApiError("INSUFFICIENT_CREDITS", "积分余额不足，请先充值", 402);
    }

    let remaining = input.amount;
    let runningBalance = previousAccount.balance;
    const ledgers: CreditLedger[] = [];

    for (const grant of grants) {
      if (remaining <= 0) {
        break;
      }

      const amount = Math.min(remaining, grant.remainingAmount);
      remaining -= amount;
      runningBalance -= amount;

      this.creditGrants.set(grant.id, {
        ...grant,
        remainingAmount: grant.remainingAmount - amount,
        updatedAt: input.createdAt
      });

      const ledger: CreditLedger = {
        id: randomUUID(),
        userId: input.userId,
        requestId: input.requestId,
        scene: `${input.scene}_${grant.grantType}`,
        type: input.type,
        direction: input.direction,
        amount,
        balanceAfter: runningBalance,
        status: "posted",
        sourceType: grant.grantType === "monthly" ? "monthly_credit" : "permanent_credit",
        sourceId: input.sourceId,
        idempotencyKey: ledgers.length === 0 ? input.idempotencyKey : `${input.idempotencyKey}:${grant.grantType}:${grant.id}`,
        remark: `${input.remark}（${grant.grantType === "monthly" ? "月卡积分" : "基础积分"}）`,
        createdAt: input.createdAt
      };

      this.creditLedger.set(ledger.id, ledger);
      this.ledgerByIdempotencyKey.set(ledger.idempotencyKey, ledger.id);
      ledgers.push(ledger);
    }

    const account: CreditAccount = {
      ...previousAccount,
      balance: runningBalance,
      totalSpent: previousAccount.totalSpent + input.amount,
      version: previousAccount.version + 1,
      updatedAt: input.createdAt
    };

    this.creditAccounts.set(input.userId, account);

    return {
      account,
      ledger: ledgers[0],
      ledgers,
      duplicated: false
    };
  }

  async applyAdminCreditAdjustment(input: ApplyAdminCreditAdjustmentInput): Promise<AppliedCreditLedger> {
    const snapshot = {
      creditAccounts: new Map(this.creditAccounts),
      creditGrants: new Map(this.creditGrants),
      creditLedger: new Map(this.creditLedger),
      ledgerByIdempotencyKey: new Map(this.ledgerByIdempotencyKey),
      adminAuditLogs: new Map(this.adminAuditLogs)
    };

    try {
      const result = await this.applyCreditLedger(input.ledger);

      if (!result.duplicated) {
        await this.createAdminAuditLog({
          ...input.audit,
          metadata: {
            ...input.audit.metadata,
            creditLedgerId: result.ledger.id,
            duplicated: false
          }
        });
      }

      return result;
    } catch (error) {
      restoreMap(this.creditAccounts, snapshot.creditAccounts);
      restoreMap(this.creditGrants, snapshot.creditGrants);
      restoreMap(this.creditLedger, snapshot.creditLedger);
      restoreMap(this.ledgerByIdempotencyKey, snapshot.ledgerByIdempotencyKey);
      restoreMap(this.adminAuditLogs, snapshot.adminAuditLogs);
      throw error;
    }
  }

  async createAdminAuditLog(input: CreateAdminAuditLogInput) {
    const id = randomUUID();

    this.adminAuditLogs.set(id, {
      id,
      ...input
    });
  }

  async listCreditLedger(userId: string, pagination: { page: number; pageSize: number }, filters: CreditLedgerFilters = {}): Promise<LedgerPage> {
    const allItems = [...this.creditLedger.values()]
      .filter((item) => item.userId === userId)
      .filter((item) => matchesCreditLedgerFilters(item, filters))
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
    const start = (pagination.page - 1) * pagination.pageSize;

    return {
      items: allItems.slice(start, start + pagination.pageSize),
      total: allItems.length
    };
  }

  async listEnabledRechargePlans() {
    return [...this.rechargePlans.values()]
      .filter((plan) => plan.enabled)
      .sort((left, right) => left.sort - right.sort);
  }

  async findRechargePlanById(id: string) {
    return this.rechargePlans.get(id) ?? null;
  }

  async hasPaidRechargeOrderForPlan(userId: string, planId: string, exceptOrderId?: string) {
    return [...this.orders.values()].some((order) =>
      order.userId === userId &&
      order.planId === planId &&
      order.status === "PAID" &&
      order.id !== exceptOrderId
    );
  }

  async findOrderById(id: string) {
    return this.orders.get(id) ?? null;
  }

  async findOrderByOrderNo(orderNo: string) {
    const orderId = this.ordersByOrderNo.get(orderNo);
    return orderId ? this.findOrderById(orderId) : null;
  }

  async findRechargeOrderByClientRequestId(userId: string, clientRequestId: string) {
    const orderId = this.ordersByClientRequestId.get(clientRequestKey(userId, clientRequestId));
    return orderId ? this.findOrderById(orderId) : null;
  }

  async createRechargeOrder(input: CreateRechargeOrderInput) {
    const order: RechargeOrder = {
      id: randomUUID(),
      ...input
    };

    this.orders.set(order.id, order);
    this.ordersByOrderNo.set(order.orderNo, order.id);
    this.ordersByClientRequestId.set(clientRequestKey(order.userId, order.clientRequestId), order.id);

    return order;
  }

  async markOrderPaid(orderId: string, paidAt: string) {
    const order = this.orders.get(orderId);

    if (!order) {
      throw new Error("Order not found");
    }

    if (order.status === "PAID") {
      throw new ApiError("ORDER_ALREADY_PAID", "订单已支付", 409);
    }

    if (order.status === "CLOSED") {
      throw new ApiError("ORDER_CLOSED", "订单已关闭", 409);
    }

    if (order.status !== "PENDING") {
      throw new ApiError("FORBIDDEN", "当前订单状态不允许支付确认", 403);
    }

    const updated: RechargeOrder = {
      ...order,
      status: "PAID",
      paidAt,
      updatedAt: paidAt
    };

    this.orders.set(orderId, updated);
    return updated;
  }

  async markOrderFailed(orderId: string, failedAt: string) {
    const order = this.orders.get(orderId);

    if (!order) {
      throw new Error("Order not found");
    }

    if (order.status === "PAID") {
      throw new ApiError("ORDER_ALREADY_PAID", "订单已支付", 409);
    }

    if (order.status === "CLOSED") {
      throw new ApiError("ORDER_CLOSED", "订单已关闭", 409);
    }

    if (order.status !== "PENDING") {
      throw new ApiError("FORBIDDEN", "当前订单状态不允许标记失败", 403);
    }

    const updated: RechargeOrder = {
      ...order,
      status: "FAILED",
      updatedAt: failedAt
    };

    this.orders.set(orderId, updated);
    return updated;
  }

  async closeExpiredRechargeOrders(cutoff: string, closedAt: string) {
    let count = 0;

    for (const order of this.orders.values()) {
      if (order.status === "PENDING" && order.createdAt <= cutoff) {
        this.orders.set(order.id, {
          ...order,
          status: "CLOSED",
          closedAt,
          updatedAt: closedAt
        });
        count += 1;
      }
    }

    return {
      count
    };
  }

  async findPaymentTransactionByIdempotencyKey(idempotencyKey: string) {
    const transactionId = this.paymentTransactionsByIdempotencyKey.get(idempotencyKey);
    return transactionId ? this.paymentTransactions.get(transactionId) ?? null : null;
  }

  async findLatestPaymentTransactionByOrderId(orderId: string) {
    return [...this.paymentTransactions.values()]
      .filter((transaction) => transaction.orderId === orderId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0] ?? null;
  }

  async createPaymentTransaction(input: CreatePaymentTransactionInput) {
    const existing = await this.findPaymentTransactionByIdempotencyKey(input.idempotencyKey);

    if (existing) {
      return existing;
    }

    const transaction: PaymentTransaction = {
      id: randomUUID(),
      ...input
    };

    this.paymentTransactions.set(transaction.id, transaction);
    this.paymentTransactionsByIdempotencyKey.set(transaction.idempotencyKey, transaction.id);

    return transaction;
  }

  async findAiTaskById(id: string) {
    return this.aiTasks.get(id) ?? null;
  }

  async findAiTaskByClientRequestId(userId: string, clientRequestId: string) {
    const taskId = this.aiTasksByClientRequestId.get(clientRequestKey(userId, clientRequestId));
    return taskId ? this.findAiTaskById(taskId) : null;
  }

  async countAiTasksForUserSince(userId: string, since: string) {
    return [...this.aiTasks.values()].filter((task) => task.userId === userId && task.createdAt >= since).length;
  }

  async countActiveAiTasksForUser(userId: string) {
    return [...this.aiTasks.values()].filter((task) =>
      task.userId === userId && (task.status === "PENDING" || task.status === "RUNNING")
    ).length;
  }

  async createAiTask(input: CreateAiTaskInput) {
    const task: AiTask = {
      id: randomUUID(),
      ...input
    };

    this.aiTasks.set(task.id, task);
    this.aiTasksByClientRequestId.set(clientRequestKey(task.userId, task.clientRequestId), task.id);

    return task;
  }

  async updateAiTask(taskId: string, input: UpdateAiTaskInput) {
    const task = this.aiTasks.get(taskId);

    if (!task) {
      throw new Error("AI task not found");
    }

    const updated: AiTask = {
      ...task,
      status: input.status,
      scopeStatus: input.scopeStatus === undefined ? task.scopeStatus : input.scopeStatus,
      errorCode: input.errorCode === undefined ? task.errorCode : input.errorCode,
      errorMessage: input.errorMessage === undefined ? task.errorMessage : input.errorMessage,
      startedAt: input.startedAt === undefined ? task.startedAt : input.startedAt,
      finishedAt: input.finishedAt === undefined ? task.finishedAt : input.finishedAt,
      updatedAt: input.updatedAt
    };

    this.aiTasks.set(taskId, updated);
    return updated;
  }

  async createAiTaskResult(input: CreateAiTaskResultInput) {
    this.aiTaskResults.set(input.taskId, input);
    return input;
  }

  async findAiTaskResult(taskId: string) {
    return this.aiTaskResults.get(taskId) ?? null;
  }

  async listAiTasks(userId: string, pagination: { page: number; pageSize: number }, filters: { type?: AiTask["type"]; status?: AiTask["status"] }): Promise<AiTaskPage> {
    const items = [...this.aiTasks.values()]
      .filter((task) => task.userId === userId)
      .filter((task) => (filters.type ? task.type === filters.type : true))
      .filter((task) => (filters.status ? task.status === filters.status : true))
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
    const start = (pagination.page - 1) * pagination.pageSize;

    return {
      items: items.slice(start, start + pagination.pageSize),
      total: items.length
    };
  }

  async listAiTasksForConversation(conversationId: string, options: { limit?: number; ascending?: boolean } = {}) {
    const items = [...this.aiTasks.values()]
      .filter((task) => task.conversationId === conversationId)
      .sort((left, right) => options.ascending ? compareTaskAsc(left, right) : compareTaskDesc(left, right));

    return typeof options.limit === "number" ? items.slice(0, options.limit) : items;
  }

  async listLatestAiTasksForConversations(conversationIds: string[]) {
    const conversationIdSet = new Set(conversationIds);
    const latestByConversationId = new Map<string, AiTask>();

    for (const task of [...this.aiTasks.values()].filter((item) => item.conversationId && conversationIdSet.has(item.conversationId))) {
      const conversationId = task.conversationId!;
      const current = latestByConversationId.get(conversationId);

      if (!current || compareTaskDesc(task, current) < 0) {
        latestByConversationId.set(conversationId, task);
      }
    }

    return conversationIds
      .map((conversationId) => latestByConversationId.get(conversationId))
      .filter((task): task is AiTask => Boolean(task));
  }

  async findAiConversationById(id: string) {
    return this.aiConversations.get(id) ?? null;
  }

  async createAiConversation(input: CreateAiConversationInput) {
    const conversation: AiConversation = {
      id: randomUUID(),
      ...input,
      uiState: input.uiState ?? null
    };

    this.aiConversations.set(conversation.id, conversation);
    return conversation;
  }

  async updateAiConversation(conversationId: string, input: UpdateAiConversationInput) {
    const conversation = this.aiConversations.get(conversationId);

    if (!conversation) {
      throw new Error("AI conversation not found");
    }

    const updated: AiConversation = {
      ...conversation,
      title: input.title === undefined ? conversation.title : input.title,
      targetPlatform: input.targetPlatform === undefined ? conversation.targetPlatform : input.targetPlatform,
      sourcePlatform: input.sourcePlatform === undefined ? conversation.sourcePlatform : input.sourcePlatform,
      status: input.status === undefined ? conversation.status : input.status,
      uiState: input.uiState === undefined ? conversation.uiState : input.uiState,
      lastMessageAt: input.lastMessageAt === undefined ? conversation.lastMessageAt : input.lastMessageAt,
      updatedAt: input.updatedAt
    };

    this.aiConversations.set(conversationId, updated);
    return updated;
  }

  async listAiConversations(
    userId: string,
    pagination: AiConversationPagination,
    filters: { mode?: AiConversation["mode"]; status?: AiConversation["status"] }
  ) {
    const items = [...this.aiConversations.values()]
      .filter((conversation) => conversation.userId === userId)
      .filter((conversation) => (filters.mode ? conversation.mode === filters.mode : true))
      .filter((conversation) => (filters.status ? conversation.status === filters.status : true))
      .sort(compareConversationDesc);

    if (pagination.mode === "cursor") {
      const cursorIndex = pagination.cursor
        ? items.findIndex((conversation) => conversation.id === pagination.cursor?.id && conversation.lastMessageAt === pagination.cursor.createdAt)
        : -1;
      const start = cursorIndex >= 0 ? cursorIndex + 1 : 0;

      return {
        items: items.slice(start, start + pagination.limit)
      };
    }

    const start = (pagination.page - 1) * pagination.pageSize;

    return {
      items: items.slice(start, start + pagination.pageSize),
      total: items.length
    };
  }

  async createAiMessage(input: CreateAiMessageInput) {
    if (input.taskId) {
      const existingId = this.aiMessagesByTaskId.get(input.taskId);
      const existing = existingId ? this.aiMessages.get(existingId) : null;

      if (existing) {
        return existing;
      }
    }

    const message: AiMessage = {
      id: randomUUID(),
      ...input
    };

    this.aiMessages.set(message.id, message);

    if (message.taskId) {
      this.aiMessagesByTaskId.set(message.taskId, message.id);
    }

    return message;
  }

  async findAiMessageByTaskId(taskId: string) {
    const messageId = this.aiMessagesByTaskId.get(taskId);
    return messageId ? this.aiMessages.get(messageId) ?? null : null;
  }

  async listAiMessages(conversationId: string, options: AiMessageListOptions = {}) {
    const sorted = [...this.aiMessages.values()]
      .filter((message) => message.conversationId === conversationId)
      .sort(compareMessageAsc);
    const direction = options.direction ?? "before";
    const cursorIndex = options.cursor
      ? sorted.findIndex((message) => message.id === options.cursor?.id && message.createdAt === options.cursor.createdAt)
      : -1;
    const filtered = options.cursor
      ? direction === "after"
        ? sorted.slice(cursorIndex >= 0 ? cursorIndex + 1 : sorted.length)
        : sorted.slice(0, cursorIndex >= 0 ? cursorIndex : 0)
      : sorted;
    const maxLimit = options.limit && options.limit > 0 ? Math.min(options.limit, 100) : undefined;
    const limited = maxLimit
      ? direction === "after"
        ? filtered.slice(0, maxLimit)
        : filtered.slice(-maxLimit)
      : filtered;

    return options.ascending === false ? [...limited].reverse() : limited;
  }

  async createAiMessageAttachment(input: CreateAiMessageAttachmentInput) {
    const existing = [...this.aiMessageAttachments.values()].find((attachment) =>
      attachment.messageId === input.messageId &&
      attachment.fileId === input.fileId &&
      attachment.role === input.role
    );

    if (existing) {
      return existing;
    }

    const attachment: AiMessageAttachment = {
      id: randomUUID(),
      ...input
    };

    this.aiMessageAttachments.set(attachment.id, attachment);
    return attachment;
  }

  async listAiMessageAttachmentsForMessages(userId: string, messageIds: string[]) {
    const messageIdSet = new Set(messageIds);

    return [...this.aiMessageAttachments.values()]
      .filter((attachment) => attachment.userId === userId && messageIdSet.has(attachment.messageId))
      .sort((left, right) => {
        const message = left.messageId.localeCompare(right.messageId);

        return message !== 0 ? message : left.displayOrder - right.displayOrder;
      })
      .map((attachment) => toAiMessageAttachmentSummary(attachment, this.uploadedFiles))
      .filter((attachment): attachment is AiMessageAttachmentSummary => Boolean(attachment));
  }

  async createAiRunEvent(input: CreateAiRunEventInput) {
    const existing = [...this.aiRunEvents.values()].find((event) => event.taskId === input.taskId && event.seq === input.seq);

    if (existing) {
      return existing;
    }

    const event: AiRunEvent = {
      id: randomUUID(),
      ...input
    };

    this.aiRunEvents.set(event.id, event);
    return event;
  }

  async listAiRunEvents(taskId: string, options: { afterSeq?: number; limit?: number } = {}) {
    const limit = options.limit && options.limit > 0 ? Math.min(options.limit, 200) : 100;

    return [...this.aiRunEvents.values()]
      .filter((event) => event.taskId === taskId && event.visibility === "public")
      .filter((event) => options.afterSeq === undefined || event.seq > options.afterSeq)
      .sort(compareRunEventAsc)
      .slice(0, limit);
  }

  async findLatestAiRunEvent(taskId: string) {
    return [...this.aiRunEvents.values()]
      .filter((event) => event.taskId === taskId)
      .sort((left, right) => right.seq - left.seq)
      .at(0) ?? null;
  }

  async getNextRunEventSeq(taskId: string) {
    const latest = await this.findLatestAiRunEvent(taskId);

    return (latest?.seq ?? 0) + 1;
  }

  async createUploadedFile(input: CreateUploadedFileInput) {
    const uploadedFile: UploadedFile = {
      id: randomUUID(),
      ...input,
      kind: input.kind ?? inferUploadedFileKind(input.ext, input.mimeType),
      storageKey: input.storageKey ?? null,
      thumbnailKey: input.thumbnailKey ?? null,
      contentJson: input.contentJson ?? null,
      updatedAt: input.updatedAt ?? input.createdAt
    };

    this.uploadedFiles.set(uploadedFile.id, uploadedFile);
    return uploadedFile;
  }

  async findUploadedFileById(id: string) {
    return this.uploadedFiles.get(id) ?? null;
  }

  async listUploadedFilesByIds(fileIds: string[]) {
    const fileIdSet = new Set(fileIds);

    return [...this.uploadedFiles.values()].filter((file) => fileIdSet.has(file.id));
  }

  async getAdminOverview(todayStart: string): Promise<AdminOverview> {
    const todayAiTasks = [...this.aiTasks.values()].filter((task) => task.createdAt >= todayStart);
    const paidOrders = [...this.orders.values()].filter((order) => order.status === "PAID");
    const todayPaidOrders = paidOrders.filter((order) => order.createdAt >= todayStart);
    const paidUsers = new Set(paidOrders.map((order) => order.userId)).size;
    const todayTokens = todayAiTasks.reduce((total, task) => {
      const result = this.aiTaskResults.get(task.id);
      return total + (result?.tokenUsage.totalTokens ?? 0);
    }, 0);
    const creditAccounts = [...this.creditAccounts.values()];

    return {
      totals: {
        users: this.users.size,
        paidUsers,
        paidConversionRate: this.users.size > 0 ? paidUsers / this.users.size : 0,
        creditBalance: creditAccounts.reduce((total, account) => total + account.balance, 0),
        creditEarned: creditAccounts.reduce((total, account) => total + account.totalEarned, 0),
        creditSpent: creditAccounts.reduce((total, account) => total + account.totalSpent, 0),
        todayAiTasks: todayAiTasks.length,
        todayAiTokens: todayTokens,
        todayPaidOrders: todayPaidOrders.length,
        todayPaidOrderAmountCents: todayPaidOrders.reduce((total, order) => total + order.amountCents, 0),
        paidOrders: paidOrders.length,
        paidOrderAmountCents: paidOrders.reduce((total, order) => total + order.amountCents, 0)
      }
    };
  }

  async listAdminUsers(pagination: { page: number; pageSize: number }, filters: AdminUserFilters): Promise<AdminUserPage> {
    const items = [...this.users.values()]
      .filter((user) => (filters.phone ? user.phone.includes(filters.phone) : true))
      .filter((user) => (filters.createdFrom ? user.createdAt >= filters.createdFrom : true))
      .filter((user) => (filters.createdTo ? user.createdAt < filters.createdTo : true))
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
    const start = (pagination.page - 1) * pagination.pageSize;

    return {
      items: items.slice(start, start + pagination.pageSize).map((user) => toAdminUserItem(user, this.creditAccounts, this.creditLedger)),
      total: items.length
    };
  }

  async listAdminCreditLedger(pagination: { page: number; pageSize: number }, filters: AdminCreditLedgerFilters): Promise<AdminCreditLedgerPage> {
    const items = [...this.creditLedger.values()]
      .filter((ledger) => (filters.type ? ledger.type === filters.type : true))
      .filter((ledger) => (filters.direction ? ledger.direction === filters.direction : true))
      .filter((ledger) => (filters.createdFrom ? ledger.createdAt >= filters.createdFrom : true))
      .filter((ledger) => (filters.createdTo ? ledger.createdAt < filters.createdTo : true))
      .filter((ledger) => {
        if (!filters.phone) {
          return true;
        }

        return (this.users.get(ledger.userId)?.phone ?? "").includes(filters.phone);
      })
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
    const start = (pagination.page - 1) * pagination.pageSize;

    return {
      items: items.slice(start, start + pagination.pageSize).map((ledger) => toAdminCreditLedgerItem(ledger, this.users)),
      total: items.length
    };
  }

  async listAdminOrders(pagination: { page: number; pageSize: number }, filters: AdminOrderFilters): Promise<AdminOrderPage> {
    const items = [...this.orders.values()]
      .filter((order) => {
        if (!filters.phone) {
          return true;
        }

        return (this.users.get(order.userId)?.phone ?? "").includes(filters.phone);
      })
      .filter((order) => (filters.status ? order.status === filters.status : true))
      .filter((order) => (filters.createdFrom ? order.createdAt >= filters.createdFrom : true))
      .filter((order) => (filters.createdTo ? order.createdAt < filters.createdTo : true))
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
    const paidItems = filters.status && filters.status !== "PAID"
      ? []
      : items.filter((order) => order.status === "PAID");
    const start = (pagination.page - 1) * pagination.pageSize;

    return {
      items: items.slice(start, start + pagination.pageSize).map((order) => toAdminOrderItem(order, this.users, this.rechargePlans, this.paymentTransactions)),
      total: items.length,
      summary: {
        filteredOrders: items.length,
        filteredOrderAmountCents: sumOrderAmountCents(items),
        filteredPaidOrders: paidItems.length,
        filteredPaidOrderAmountCents: sumOrderAmountCents(paidItems)
      }
    };
  }

  async listAdminAiTasks(pagination: { page: number; pageSize: number }, filters: { type?: AiTask["type"]; status?: AiTask["status"] }): Promise<AdminAiTaskPage> {
    const items = [...this.aiTasks.values()]
      .filter((task) => (filters.type ? task.type === filters.type : true))
      .filter((task) => (filters.status ? task.status === filters.status : true))
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
    const start = (pagination.page - 1) * pagination.pageSize;

    return {
      items: items.slice(start, start + pagination.pageSize).map((task) => toAdminAiTaskItem(task, this.users, this.aiTaskResults)),
      total: items.length
    };
  }

  async listAdminUploadedFiles(pagination: { page: number; pageSize: number }, filters: { scanStatus?: UploadedFile["scanStatus"] }): Promise<AdminUploadedFilePage> {
    const items = [...this.uploadedFiles.values()]
      .filter((file) => (filters.scanStatus ? file.scanStatus === filters.scanStatus : true))
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
    const start = (pagination.page - 1) * pagination.pageSize;

    return {
      items: items.slice(start, start + pagination.pageSize).map((file) => toAdminUploadedFileItem(file, this.users)),
      total: items.length
    };
  }

  async listAdminContactRequests(pagination: { page: number; pageSize: number }, filters: AdminContactRequestFilters): Promise<AdminContactRequestPage> {
    const items = [...this.contactRequests.values()]
      .filter((request) => (filters.contactMethod ? request.contactMethod === filters.contactMethod : true))
      .filter((request) => (filters.category ? request.category === filters.category : true))
      .filter((request) => (filters.source ? request.source.includes(filters.source) : true))
      .filter((request) => (filters.createdFrom ? request.createdAt >= filters.createdFrom : true))
      .filter((request) => (filters.createdTo ? request.createdAt < filters.createdTo : true))
      .filter((request) => {
        if (!filters.keyword) {
          return true;
        }

        return [request.userPhone, request.contactValue, request.name]
          .filter(Boolean)
          .some((value) => value?.includes(filters.keyword ?? ""));
      })
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
    const start = (pagination.page - 1) * pagination.pageSize;

    return {
      items: items.slice(start, start + pagination.pageSize).map(toAdminContactRequestItem),
      total: items.length
    };
  }

  async findCreditReservationByIdempotencyKey(idempotencyKey: string) {
    const reservationId = this.creditReservationsByIdempotencyKey.get(idempotencyKey);
    return reservationId ? this.creditReservations.get(reservationId) ?? null : null;
  }

  async findCreditReservationByTaskId(taskId: string) {
    const reservationId = this.creditReservationsByTaskId.get(taskId);
    return reservationId ? this.creditReservations.get(reservationId) ?? null : null;
  }

  async createCreditReservation(input: CreateCreditReservationInput) {
    const existing = await this.findCreditReservationByIdempotencyKey(input.idempotencyKey);

    if (existing) {
      return existing;
    }

    const account = await this.ensureCreditAccount(input.userId, input.createdAt);
    const activeReserved = await this.getActiveReservedAmount(input.userId);

    if (account.balance - activeReserved < input.amount) {
      throw new ApiError("INSUFFICIENT_CREDITS", "积分余额不足，请先充值", 402);
    }

    const reservation: CreditReservation = {
      id: randomUUID(),
      ...input
    };

    this.creditReservations.set(reservation.id, reservation);
    this.creditReservationsByIdempotencyKey.set(reservation.idempotencyKey, reservation.id);
    this.creditReservationsByTaskId.set(reservation.taskId, reservation.id);

    return reservation;
  }

  async updateCreditReservationStatus(id: string, status: CreditReservation["status"], updatedAt: string) {
    const reservation = this.creditReservations.get(id);

    if (!reservation) {
      throw new Error("Credit reservation not found");
    }

    const updated: CreditReservation = {
      ...reservation,
      status,
      updatedAt
    };

    this.creditReservations.set(id, updated);
    return updated;
  }

  async getActiveReservedAmount(userId: string) {
    return [...this.creditReservations.values()]
      .filter((reservation) => reservation.userId === userId && reservation.status === "RESERVED")
      .reduce((total, reservation) => total + reservation.amount, 0);
  }
}

function clientRequestKey(userId: string, clientRequestId: string) {
  return `${userId}:${clientRequestId}`;
}

function legalConsentKey(userId: string, agreementVersion: string, privacyVersion: string) {
  return `${userId}:${agreementVersion}:${privacyVersion}`;
}

function userMembershipSourceKey(userId: string, type: string, sourceType: string, sourceId: string) {
  return `${userId}:${type}:${sourceType}:${sourceId}`;
}

function toAdminUserItem(user: User, creditAccounts: Map<string, CreditAccount>, creditLedger: Map<string, CreditLedger>): AdminUserPage["items"][number] {
  const account = creditAccounts.get(user.id);
  const latestLedger = [...creditLedger.values()]
    .filter((item) => item.userId === user.id)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];

  return {
    id: user.id,
    phone: user.phone,
    displayName: user.displayName,
    status: user.status,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
    creditBalance: account?.balance ?? 0,
    totalEarned: account?.totalEarned ?? 0,
    totalSpent: account?.totalSpent ?? 0,
    latestLedger: latestLedger
      ? {
          amount: latestLedger.amount,
          direction: latestLedger.direction,
          remark: latestLedger.remark,
          createdAt: latestLedger.createdAt
        }
      : null
  };
}

function toAdminCreditLedgerItem(ledger: CreditLedger, users: Map<string, User>): AdminCreditLedgerPage["items"][number] {
  return {
    id: ledger.id,
    userPhone: users.get(ledger.userId)?.phone ?? "",
    direction: ledger.direction,
    type: ledger.type,
    amount: ledger.amount,
    balanceAfter: ledger.balanceAfter,
    sourceType: ledger.sourceType,
    sourceId: ledger.sourceId,
    remark: ledger.remark,
    createdAt: ledger.createdAt
  };
}

function toAdminContactRequestItem(request: ContactRequest): AdminContactRequestPage["items"][number] {
  return {
    id: request.id,
    userPhone: request.userPhone,
    name: request.name,
    contactMethod: request.contactMethod,
    contactValue: request.contactValue,
    category: request.category,
    message: request.message,
    source: request.source,
    createdAt: request.createdAt
  };
}

function toAdminOrderItem(order: RechargeOrder, users: Map<string, User>, plans: Map<string, RechargePlan>, transactions: Map<string, PaymentTransaction>): AdminOrderPage["items"][number] {
  const latestTransaction = [...transactions.values()]
    .filter((transaction) => transaction.orderId === order.id)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0] ?? null;

  return {
    id: order.id,
    orderNo: order.orderNo,
    userPhone: users.get(order.userId)?.phone ?? "",
    planName: plans.get(order.planId)?.name ?? order.planId,
    amountCents: order.amountCents,
    points: order.points,
    bonusPoints: order.bonusPoints,
    totalPoints: order.totalPoints,
    payChannel: order.payChannel,
    paymentActionType: toPaymentActionType(order.payChannel),
    status: order.status,
    clientRequestId: order.clientRequestId,
    createdAt: order.createdAt,
    paidAt: order.paidAt,
    closedAt: order.closedAt,
    expiresAt: getOrderExpiresAt(order.createdAt),
    expired: order.status === "PENDING" && isOrderExpired(order.createdAt),
    latestPaymentStatus: latestTransaction?.status ?? null,
    latestPaymentProviderTradeNo: latestTransaction?.providerTradeNo ?? null,
    latestPaymentFailedReason: latestTransaction?.failedReason ?? null
  };
}

function sumOrderAmountCents(orders: RechargeOrder[]) {
  return orders.reduce((total, order) => total + order.amountCents, 0);
}

function toPaymentActionType(payChannel: RechargeOrder["payChannel"]): AdminOrderPage["items"][number]["paymentActionType"] {
  if (payChannel === "alipay") {
    return "redirect";
  }

  if (payChannel === "wechat") {
    return "qr_code";
  }

  return "mock";
}

function compareConversationDesc(left: AiConversation, right: AiConversation) {
  const time = right.lastMessageAt.localeCompare(left.lastMessageAt);

  return time !== 0 ? time : right.id.localeCompare(left.id);
}

function compareMessageAsc(left: AiMessage, right: AiMessage) {
  const time = left.createdAt.localeCompare(right.createdAt);

  return time !== 0 ? time : left.id.localeCompare(right.id);
}

function compareTaskAsc(left: AiTask, right: AiTask) {
  const time = left.createdAt.localeCompare(right.createdAt);

  return time !== 0 ? time : left.id.localeCompare(right.id);
}

function compareTaskDesc(left: AiTask, right: AiTask) {
  const time = right.createdAt.localeCompare(left.createdAt);

  return time !== 0 ? time : right.id.localeCompare(left.id);
}

function compareRunEventAsc(left: AiRunEvent, right: AiRunEvent) {
  return left.seq !== right.seq ? left.seq - right.seq : left.createdAt.localeCompare(right.createdAt);
}

function toAiMessageAttachmentSummary(attachment: AiMessageAttachment, files: Map<string, UploadedFile>): AiMessageAttachmentSummary | null {
  const file = files.get(attachment.fileId);

  if (!file) {
    return null;
  }

  return {
    ...attachment,
    file: {
      fileId: file.id,
      kind: file.kind ?? inferUploadedFileKind(file.ext, file.mimeType),
      originalName: file.originalName,
      ext: file.ext,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
      scanStatus: file.scanStatus,
      riskFlags: file.riskFlags,
      contentPreview: createContentPreview(file.contentText, file),
      hasThumbnail: Boolean(file.thumbnailKey),
      createdAt: file.createdAt
    }
  };
}

function toAdminAiTaskItem(task: AiTask, users: Map<string, User>, results: Map<string, AiTaskResult>): AdminAiTaskPage["items"][number] {
  const result = results.get(task.id);

  return {
    id: task.id,
    userPhone: users.get(task.userId)?.phone ?? "",
    type: task.type,
    status: task.status,
    scopeStatus: task.scopeStatus,
    costPoints: task.costPoints,
    model: result?.model ?? null,
    tokenUsage: result?.tokenUsage ?? null,
    errorCode: task.errorCode,
    errorMessage: truncateText(task.errorMessage, 160),
    createdAt: task.createdAt,
    finishedAt: task.finishedAt
  };
}

function toAdminUploadedFileItem(file: UploadedFile, users: Map<string, User>): AdminUploadedFilePage["items"][number] {
  return {
    id: file.id,
    userPhone: users.get(file.userId)?.phone ?? "",
    originalName: file.originalName,
    ext: file.ext,
    sizeBytes: file.sizeBytes,
    sha256Prefix: file.sha256.slice(0, 12),
    scanStatus: file.scanStatus,
    riskFlags: file.riskFlags,
    createdAt: file.createdAt
  };
}

function truncateText(value: string | null, maxLength: number) {
  if (!value || value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}...`;
}

function createContentPreview(value: string | null, file?: { originalName: string; ext: string; mimeType: string }) {
  if (value) {
    return value.length > 800 ? `${value.slice(0, 800)}...` : value;
  }

  if (file && inferUploadedFileKind(file.ext, file.mimeType) === "image") {
    return `图片附件：${file.originalName}`;
  }

  return "";
}

function inferUploadedFileKind(ext: string, mimeType: string): UploadedFile["kind"] {
  const normalizedExt = ext.toLowerCase();
  const normalizedMime = mimeType.toLowerCase();

  if (normalizedMime.startsWith("image/") || [".png", ".jpg", ".jpeg", ".webp"].includes(normalizedExt)) {
    return "image";
  }

  if (normalizedExt === ".py") {
    return "code";
  }

  if (normalizedExt === ".log") {
    return "log";
  }

  if (normalizedExt === ".md") {
    return "markdown";
  }

  return "text";
}

function restoreMap<K, V>(target: Map<K, V>, snapshot: Map<K, V>) {
  target.clear();

  for (const [key, value] of snapshot) {
    target.set(key, value);
  }
}
