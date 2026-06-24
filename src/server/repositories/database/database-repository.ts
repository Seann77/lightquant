import { randomUUID } from "crypto";
import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import type {
  AiTask,
  AiConversation,
  AiMessage,
  AiMessageAttachment,
  AiMessageAttachmentSummary,
  AiRunEvent,
  AiTaskResult,
  AiModelProfile,
  ContactRequest,
  CreditAccount,
  CreditLedger,
  CreditReservation,
  PaymentTransaction,
  RechargeOrder,
  RechargePlan,
  SmsCodeRecord,
  UploadedFile,
  User,
  UserLegalConsent,
  UserMembership
} from "@/server/domain";
import { ApiError } from "@/server/http/api-response";
import { measureAiPerf } from "@/server/ai/ai-perf";
import { getOrderExpiresAt, isOrderExpired } from "@/server/payments/payment-config";
import { getPrismaClient } from "@/server/repositories/database/prisma-client";
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
  LedgerPage,
  LightQuantRepository,
  SetActiveAiModelProfileInput,
  UpsertUserMembershipInput,
  UpdateAiConversationInput,
  UpdateAiTaskInput
} from "@/server/repositories/types";

type PrismaDb = PrismaClient | Prisma.TransactionClient;

export class DatabaseLightQuantRepository implements LightQuantRepository {
  constructor(private readonly db: PrismaDb = getPrismaClient()) {}

  async withTransaction<T>(callback: (repository: DatabaseLightQuantRepository) => Promise<T>) {
    if (!isRootPrismaClient(this.db)) {
      return callback(this);
    }

    return this.db.$transaction(
      async (transaction) => callback(new DatabaseLightQuantRepository(transaction)),
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 15_000,
        timeout: 30_000
      }
    );
  }

  async createSmsCode(input: CreateSmsCodeInput) {
    const record = await this.db.smsCode.create({
      data: {
        phone: input.phone,
        scene: input.scene,
        codeHash: input.codeHash,
        mockCode: input.mockCode,
        expiresAt: toDate(input.expiresAt),
        requestIp: input.requestIp,
        createdAt: toDate(input.createdAt)
      }
    });

    return toSmsCode(record);
  }

  async countSmsCodesByPhoneSceneSince(phone: string, scene: SmsCodeRecord["scene"], since: string) {
    return this.db.smsCode.count({
      where: {
        phone,
        scene,
        createdAt: {
          gte: toDate(since)
        }
      }
    });
  }

  async countSmsCodesByRequestIpSince(requestIp: string, since: string) {
    return this.db.smsCode.count({
      where: {
        requestIp,
        createdAt: {
          gte: toDate(since)
        }
      }
    });
  }

  async findSmsCodeForVerification(phone: string, scene: SmsCodeRecord["scene"], code: string, now: string) {
    const record = await this.db.smsCode.findFirst({
      where: {
        phone,
        scene,
        usedAt: null,
        expiresAt: {
          gt: toDate(now)
        },
        OR: [
          {
            mockCode: code
          },
          {
            codeHash: code
          }
        ]
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return record ? toSmsCode(record) : null;
  }

  async findLatestSmsCodeForVerification(phone: string, scene: SmsCodeRecord["scene"], now: string) {
    const record = await this.db.smsCode.findFirst({
      where: {
        phone,
        scene,
        usedAt: null,
        expiresAt: {
          gt: toDate(now)
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return record ? toSmsCode(record) : null;
  }

  async markSmsCodeVerificationFailed(input: { id: string; failedAt: string; resetBefore: string }) {
    const current = await this.db.smsCode.findUnique({
      where: {
        id: input.id
      }
    });

    if (!current) {
      return null;
    }

    const resetBefore = toDate(input.resetBefore);
    const failedAt = toDate(input.failedAt);
    const shouldReset = !current.lastFailedAt || current.lastFailedAt <= resetBefore;
    const record = await this.db.smsCode.update({
      where: {
        id: input.id
      },
      data: {
        failedAttempts: shouldReset ? 1 : current.failedAttempts + 1,
        lastFailedAt: failedAt
      }
    });

    return toSmsCode(record);
  }

  async markSmsCodeUsed(id: string, usedAt: string) {
    await this.db.smsCode.updateMany({
      where: {
        id,
        usedAt: null
      },
      data: {
        usedAt: toDate(usedAt)
      }
    });
  }

  async findUserById(id: string) {
    const user = await this.db.user.findUnique({
      where: {
        id
      }
    });

    return user ? toUser(user) : null;
  }

  async findUserByPhone(phone: string) {
    const user = await this.db.user.findUnique({
      where: {
        phone
      }
    });

    return user ? toUser(user) : null;
  }

  async findUserByInviteCode(inviteCode: string) {
    const user = await this.db.user.findUnique({
      where: {
        inviteCode
      }
    });

    return user ? toUser(user) : null;
  }

  async createUser(input: CreateUserInput) {
    try {
      const user = await this.db.user.create({
        data: {
          phone: input.phone,
          displayName: input.displayName,
          inviteCode: input.inviteCode,
          referredBy: input.referredBy,
          status: "active",
          createdAt: toDate(input.createdAt),
          lastLoginAt: toDate(input.lastLoginAt)
        }
      });

      return toUser(user);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ApiError("IDEMPOTENCY_CONFLICT", "用户已存在或邀请码冲突，请重试", 409);
      }

      throw error;
    }
  }

  async createUserLegalConsent(input: CreateUserLegalConsentInput) {
    const consent = await this.db.userLegalConsent.upsert({
      where: {
        userId_agreementVersion_privacyVersion: {
          userId: input.userId,
          agreementVersion: input.agreementVersion,
          privacyVersion: input.privacyVersion
        }
      },
      create: {
        userId: input.userId,
        agreementVersion: input.agreementVersion,
        privacyVersion: input.privacyVersion,
        agreedAt: toDate(input.agreedAt),
        requestIp: input.requestIp,
        userAgent: input.userAgent,
        source: input.source
      },
      update: {}
    });

    return toUserLegalConsent(consent);
  }

  async createContactRequest(input: CreateContactRequestInput) {
    const request = await this.db.contactRequest.create({
      data: {
        userId: input.userId,
        userPhone: input.userPhone,
        name: input.name,
        contactMethod: input.contactMethod,
        contactValue: input.contactValue,
        category: input.category,
        message: input.message,
        source: input.source,
        requestIp: input.requestIp,
        userAgent: input.userAgent,
        createdAt: toDate(input.createdAt),
        updatedAt: toDate(input.updatedAt)
      }
    });

    return toContactRequest(request);
  }

  async countContactRequestsByUserSince(userId: string, since: string) {
    return this.db.contactRequest.count({
      where: {
        userId,
        createdAt: {
          gte: toDate(since)
        }
      }
    });
  }

  async countContactRequestsByRequestIpSince(requestIp: string, since: string) {
    return this.db.contactRequest.count({
      where: {
        requestIp,
        createdAt: {
          gte: toDate(since)
        }
      }
    });
  }

  async updateUserLastLogin(userId: string, lastLoginAt: string) {
    const user = await this.db.user.update({
      where: {
        id: userId
      },
      data: {
        lastLoginAt: toDate(lastLoginAt)
      }
    });

    return toUser(user);
  }

  async listAiModelProfiles() {
    const profiles = await this.db.aiModelProfile.findMany({
      orderBy: [
        {
          enabled: "desc"
        },
        {
          updatedAt: "desc"
        }
      ]
    });

    return profiles.map(toAiModelProfile);
  }

  async findAiModelProfileById(profileId: string) {
    const profile = await this.db.aiModelProfile.findUnique({
      where: {
        id: profileId
      }
    });

    return profile ? toAiModelProfile(profile) : null;
  }

  async getActiveAiModelProfile() {
    const active = await this.db.aiModelActiveProfile.findUnique({
      where: {
        id: "active"
      },
      include: {
        profile: true
      }
    });

    return active?.profile ? toAiModelProfile(active.profile) : null;
  }

  async setActiveAiModelProfile(input: SetActiveAiModelProfileInput) {
    const profile = await this.db.aiModelProfile.findUnique({
      where: {
        id: input.profileId
      }
    });

    if (!profile) {
      throw new ApiError("NOT_FOUND", "模型配置不存在", 404);
    }

    await this.db.aiModelActiveProfile.upsert({
      where: {
        id: "active"
      },
      create: {
        id: "active",
        profileId: input.profileId,
        updatedAt: toDate(input.updatedAt)
      },
      update: {
        profileId: input.profileId,
        updatedAt: toDate(input.updatedAt)
      }
    });

    return toAiModelProfile(profile);
  }

  async findActiveMembershipForUser(userId: string, type: UserMembership["type"], at: string) {
    const membership = await this.db.userMembership.findFirst({
      where: {
        userId,
        type,
        status: "active",
        startsAt: {
          lte: toDate(at)
        },
        endsAt: {
          gte: toDate(at)
        }
      },
      orderBy: {
        endsAt: "desc"
      }
    });

    return membership ? toUserMembership(membership) : null;
  }

  async upsertUserMembership(input: UpsertUserMembershipInput) {
    const membership = await this.db.userMembership.upsert({
      where: {
        userId_type_sourceType_sourceId: {
          userId: input.userId,
          type: input.type,
          sourceType: input.sourceType,
          sourceId: input.sourceId
        }
      },
      create: {
        userId: input.userId,
        type: input.type,
        status: input.status,
        startsAt: toDate(input.startsAt),
        endsAt: toDate(input.endsAt),
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        createdAt: toDate(input.createdAt),
        updatedAt: toDate(input.updatedAt)
      },
      update: {
        status: input.status,
        startsAt: toDate(input.startsAt),
        endsAt: toDate(input.endsAt),
        updatedAt: toDate(input.updatedAt)
      }
    });

    return toUserMembership(membership);
  }

  async getCreditAccount(userId: string) {
    const account = await this.db.creditAccount.findUnique({
      where: {
        userId
      }
    });

    return account ? toCreditAccount(account) : null;
  }

  async ensureCreditAccount(userId: string, now: string) {
    const existing = await measureAiPerf("repository.credit_account.ensure.find_existing", {}, () => this.db.creditAccount.findUnique({
      where: {
        userId
      }
    }));

    if (existing) {
      return toCreditAccount(existing);
    }

    const account = await measureAiPerf("repository.credit_account.ensure.create", {}, () => this.db.creditAccount.create({
      data: {
        userId,
        balance: 0,
        totalEarned: 0,
        totalSpent: 0,
        version: 0,
        updatedAt: toDate(now)
      }
    }).catch(async (error) => {
      if (!isUniqueConstraintError(error)) {
        throw error;
      }

      const racedAccount = await this.db.creditAccount.findUnique({
        where: {
          userId
        }
      });

      if (!racedAccount) {
        throw error;
      }

      return racedAccount;
    }));

    return toCreditAccount(account);
  }

  async applyCreditLedger(input: ApplyCreditLedgerInput): Promise<AppliedCreditLedger> {
    return this.withTransaction(async (repository) => repository.applyCreditLedgerInTransaction(input));
  }

  async applyAdminCreditAdjustment(input: ApplyAdminCreditAdjustmentInput): Promise<AppliedCreditLedger> {
    return this.withTransaction(async (repository) => {
      const result = await repository.applyCreditLedgerInTransaction(input.ledger);
      await repository.createAdminAuditLog({
        ...input.audit,
        metadata: {
          ...input.audit.metadata,
          creditLedgerId: result.ledger.id,
          duplicated: result.duplicated
        }
      });

      return result;
    });
  }

  async createAdminAuditLog(input: CreateAdminAuditLogInput) {
    await this.db.adminAuditLog.create({
      data: {
        adminUserId: input.adminUserId,
        adminPhone: input.adminPhone,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId,
        summary: input.summary,
        metadata: toJsonObject(input.metadata),
        requestId: input.requestId,
        requestIp: input.requestIp,
        createdAt: toDate(input.createdAt)
      }
    });
  }

  private async applyCreditLedgerInTransaction(input: ApplyCreditLedgerInput): Promise<AppliedCreditLedger> {
    const existing = await this.db.creditLedger.findUnique({
      where: {
        idempotencyKey: input.idempotencyKey
      }
    });

    if (existing) {
      return {
        account: await this.ensureCreditAccount(input.userId, input.createdAt),
        ledger: toCreditLedger(existing),
        duplicated: true
      };
    }

    await this.ensureCreditAccount(input.userId, input.createdAt);
    await lockCreditAccount(this.db, input.userId);

    const existingAfterLock = await this.db.creditLedger.findUnique({
      where: {
        idempotencyKey: input.idempotencyKey
      }
    });

    if (existingAfterLock) {
      return {
        account: await this.ensureCreditAccount(input.userId, input.createdAt),
        ledger: toCreditLedger(existingAfterLock),
        duplicated: true
      };
    }

    const previousAccount = await this.db.creditAccount.findUniqueOrThrow({
      where: {
        userId: input.userId
      }
    });
    const signedAmount = input.direction === "in" ? input.amount : -input.amount;
    const nextBalance = previousAccount.balance + signedAmount;

    if (nextBalance < 0) {
      throw new ApiError("INSUFFICIENT_CREDITS", "积分余额不足，请先充值", 402);
    }

    const updatedAccount = await this.db.creditAccount.update({
      where: {
        userId: input.userId
      },
      data: {
        balance: nextBalance,
        totalEarned: input.direction === "in" ? { increment: input.amount } : undefined,
        totalSpent: input.direction === "out" ? { increment: input.amount } : undefined,
        version: {
          increment: 1
        },
        updatedAt: toDate(input.createdAt)
      }
    });
    const ledger = await this.db.creditLedger.create({
      data: {
        id: randomUUID(),
        userId: input.userId,
        requestId: input.requestId,
        scene: input.scene,
        type: input.type,
        direction: input.direction,
        amount: input.amount,
        balanceAfter: updatedAccount.balance,
        status: "posted",
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        idempotencyKey: input.idempotencyKey,
        remark: input.remark,
        createdAt: toDate(input.createdAt)
      }
    });

    return {
      account: toCreditAccount(updatedAccount),
      ledger: toCreditLedger(ledger),
      duplicated: false
    };
  }

  async listCreditLedger(userId: string, pagination: { page: number; pageSize: number }): Promise<LedgerPage> {
    const [items, total] = await Promise.all([
      this.db.creditLedger.findMany({
        where: {
          userId
        },
        orderBy: {
          createdAt: "desc"
        },
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize
      }),
      this.db.creditLedger.count({
        where: {
          userId
        }
      })
    ]);

    return {
      items: items.map(toCreditLedger),
      total
    };
  }

  async listEnabledRechargePlans() {
    const plans = await this.db.rechargePlan.findMany({
      where: {
        enabled: true
      },
      orderBy: {
        sort: "asc"
      }
    });

    return plans.map(toRechargePlan);
  }

  async findRechargePlanById(id: string) {
    const plan = await this.db.rechargePlan.findUnique({
      where: {
        id
      }
    });

    return plan ? toRechargePlan(plan) : null;
  }

  async findOrderById(id: string) {
    const order = await this.db.rechargeOrder.findUnique({
      where: {
        id
      }
    });

    return order ? toRechargeOrder(order) : null;
  }

  async findOrderByOrderNo(orderNo: string) {
    const order = await this.db.rechargeOrder.findUnique({
      where: {
        orderNo
      }
    });

    return order ? toRechargeOrder(order) : null;
  }

  async findRechargeOrderByClientRequestId(userId: string, clientRequestId: string) {
    const order = await this.db.rechargeOrder.findUnique({
      where: {
        userId_clientRequestId: {
          userId,
          clientRequestId
        }
      }
    });

    return order ? toRechargeOrder(order) : null;
  }

  async createRechargeOrder(input: CreateRechargeOrderInput) {
    try {
      const order = await this.db.rechargeOrder.create({
        data: {
          orderNo: input.orderNo,
          userId: input.userId,
          planId: input.planId,
          amountCents: input.amountCents,
          points: input.points,
          bonusPoints: input.bonusPoints,
          totalPoints: input.totalPoints,
          payChannel: input.payChannel,
          status: input.status,
          clientRequestId: input.clientRequestId,
          paidAt: input.paidAt ? toDate(input.paidAt) : null,
          closedAt: input.closedAt ? toDate(input.closedAt) : null,
          createdAt: toDate(input.createdAt),
          updatedAt: toDate(input.updatedAt)
        }
      });

      return toRechargeOrder(order);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        const existing = await this.findRechargeOrderByClientRequestId(input.userId, input.clientRequestId);

        if (existing) {
          return existing;
        }
      }

      throw error;
    }
  }

  async markOrderPaid(orderId: string, paidAt: string) {
    const result = await this.db.rechargeOrder.updateMany({
      where: {
        id: orderId,
        status: "PENDING"
      },
      data: {
        status: "PAID",
        paidAt: toDate(paidAt),
        updatedAt: toDate(paidAt)
      }
    });

    if (result.count === 0) {
      const existing = await this.findOrderById(orderId);

      if (existing?.status === "PAID") {
        throw new ApiError("ORDER_ALREADY_PAID", "订单已支付", 409);
      }

      if (existing?.status === "CLOSED") {
        throw new ApiError("ORDER_CLOSED", "订单已关闭", 409);
      }

      throw new ApiError("FORBIDDEN", "当前订单状态不允许支付确认", 403);
    }

    const order = await this.db.rechargeOrder.findUniqueOrThrow({
      where: {
        id: orderId
      }
    });

    return toRechargeOrder(order);
  }

  async markOrderFailed(orderId: string, failedAt: string) {
    const result = await this.db.rechargeOrder.updateMany({
      where: {
        id: orderId,
        status: "PENDING"
      },
      data: {
        status: "FAILED",
        updatedAt: toDate(failedAt)
      }
    });

    if (result.count === 0) {
      const existing = await this.findOrderById(orderId);

      if (existing?.status === "PAID") {
        throw new ApiError("ORDER_ALREADY_PAID", "订单已支付", 409);
      }

      if (existing?.status === "CLOSED") {
        throw new ApiError("ORDER_CLOSED", "订单已关闭", 409);
      }

      throw new ApiError("FORBIDDEN", "当前订单状态不允许标记失败", 403);
    }

    const order = await this.db.rechargeOrder.findUniqueOrThrow({
      where: {
        id: orderId
      }
    });

    return toRechargeOrder(order);
  }

  async closeExpiredRechargeOrders(cutoff: string, closedAt: string) {
    const result = await this.db.rechargeOrder.updateMany({
      where: {
        status: "PENDING",
        createdAt: {
          lte: toDate(cutoff)
        }
      },
      data: {
        status: "CLOSED",
        closedAt: toDate(closedAt),
        updatedAt: toDate(closedAt)
      }
    });

    return {
      count: result.count
    };
  }

  async findPaymentTransactionByIdempotencyKey(idempotencyKey: string) {
    const transaction = await this.db.paymentTransaction.findUnique({
      where: {
        idempotencyKey
      }
    });

    return transaction ? toPaymentTransaction(transaction) : null;
  }

  async findLatestPaymentTransactionByOrderId(orderId: string) {
    const transaction = await this.db.paymentTransaction.findFirst({
      where: {
        orderId
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return transaction ? toPaymentTransaction(transaction) : null;
  }

  async createPaymentTransaction(input: CreatePaymentTransactionInput) {
    const existing = await this.findPaymentTransactionByIdempotencyKey(input.idempotencyKey);

    if (existing) {
      return existing;
    }

    try {
      const transaction = await this.db.paymentTransaction.create({
        data: {
          orderId: input.orderId,
          provider: input.provider,
          providerTradeNo: input.providerTradeNo,
          notifyId: input.notifyId,
          amountCents: input.amountCents,
          status: input.status,
          rawPayload: toJsonObject(input.rawPayload),
          idempotencyKey: input.idempotencyKey,
          verifiedAt: input.verifiedAt ? toDate(input.verifiedAt) : null,
          failedReason: input.failedReason,
          orderStatusBefore: input.orderStatusBefore,
          orderStatusAfter: input.orderStatusAfter,
          createdAt: toDate(input.createdAt)
        }
      });

      return toPaymentTransaction(transaction);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        const transaction = await this.findPaymentTransactionByIdempotencyKey(input.idempotencyKey);

        if (transaction) {
          return transaction;
        }
      }

      throw error;
    }
  }

  async findAiTaskById(id: string) {
    const task = await measureAiPerf("repository.ai_task.find_by_id", {
      taskId: id
    }, () => this.db.aiTask.findUnique({
      where: {
        id
      }
    }));

    return task ? toAiTask(task) : null;
  }

  async findAiTaskByClientRequestId(userId: string, clientRequestId: string) {
    const task = await measureAiPerf("repository.ai_task.find_by_client_request", {}, () => this.db.aiTask.findUnique({
      where: {
        userId_clientRequestId: {
          userId,
          clientRequestId
        }
      }
    }));

    return task ? toAiTask(task) : null;
  }

  async countAiTasksForUserSince(userId: string, since: string) {
    return this.db.aiTask.count({
      where: {
        userId,
        createdAt: {
          gte: toDate(since)
        }
      }
    });
  }

  async countActiveAiTasksForUser(userId: string) {
    return this.db.aiTask.count({
      where: {
        userId,
        status: {
          in: ["PENDING", "RUNNING"]
        }
      }
    });
  }

  async createAiTask(input: CreateAiTaskInput) {
    try {
      const task = await measureAiPerf("repository.ai_task.create", {
        taskType: input.type,
        conversationId: input.conversationId
      }, () => this.db.aiTask.create({
        data: {
          userId: input.userId,
          conversationId: input.conversationId,
          type: input.type,
          status: input.status,
          scopeStatus: input.scopeStatus,
          sourcePlatform: input.sourcePlatform,
          targetPlatform: input.targetPlatform,
          prompt: input.prompt,
          inputCode: input.inputCode,
          inputFileId: input.inputFileId,
          costPoints: input.costPoints,
          clientRequestId: input.clientRequestId,
          requestId: input.requestId,
          errorCode: input.errorCode,
          errorMessage: input.errorMessage,
          startedAt: input.startedAt ? toDate(input.startedAt) : null,
          finishedAt: input.finishedAt ? toDate(input.finishedAt) : null,
          createdAt: toDate(input.createdAt),
          updatedAt: toDate(input.updatedAt)
        }
      }));

      return toAiTask(task);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        const existing = await this.findAiTaskByClientRequestId(input.userId, input.clientRequestId);

        if (existing) {
          return existing;
        }
      }

      throw error;
    }
  }

  async updateAiTask(taskId: string, input: UpdateAiTaskInput) {
    const task = await measureAiPerf("repository.ai_task.update", {
      taskId,
      nextStatus: input.status
    }, () => this.db.aiTask.update({
      where: {
        id: taskId
      },
      data: {
        status: input.status,
        scopeStatus: input.scopeStatus,
        errorCode: input.errorCode,
        errorMessage: input.errorMessage,
        startedAt: input.startedAt === undefined ? undefined : input.startedAt ? toDate(input.startedAt) : null,
        finishedAt: input.finishedAt === undefined ? undefined : input.finishedAt ? toDate(input.finishedAt) : null,
        updatedAt: toDate(input.updatedAt)
      }
    }));

    return toAiTask(task);
  }

  async createAiTaskResult(input: CreateAiTaskResultInput) {
    const result = await this.db.aiTaskResult.upsert({
      where: {
        taskId: input.taskId
      },
      create: {
        taskId: input.taskId,
        resultType: input.resultType,
        scopeStatus: input.scopeStatus,
        generatedCode: input.generatedCode,
        explanation: input.explanation,
        migrationNotes: input.migrationNotes,
        riskWarnings: input.riskWarnings,
        reportJson: input.reportJson === null ? Prisma.JsonNull : toJsonObject(input.reportJson),
        model: input.model,
        tokenUsage: toJsonObject(input.tokenUsage),
        createdAt: toDate(input.createdAt)
      },
      update: {}
    });

    return toAiTaskResult(result);
  }

  async findAiTaskResult(taskId: string) {
    const result = await measureAiPerf("repository.ai_task_result.find_by_task", {
      taskId
    }, () => this.db.aiTaskResult.findUnique({
      where: {
        taskId
      }
    }));

    return result ? toAiTaskResult(result) : null;
  }

  async listAiTasks(userId: string, pagination: { page: number; pageSize: number }, filters: { type?: AiTask["type"]; status?: AiTask["status"] }): Promise<AiTaskPage> {
    const where = {
      userId,
      type: filters.type,
      status: filters.status
    };
    const [items, total] = await Promise.all([
      this.db.aiTask.findMany({
        where,
        orderBy: {
          createdAt: "desc"
        },
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize
      }),
      this.db.aiTask.count({
        where
      })
    ]);

    return {
      items: items.map(toAiTask),
      total
    };
  }

  async listAiTasksForConversation(conversationId: string, options: { limit?: number; ascending?: boolean } = {}) {
    const items = await this.db.aiTask.findMany({
      where: {
        conversationId
      },
      orderBy: [
        { createdAt: options.ascending ? "asc" : "desc" },
        { id: options.ascending ? "asc" : "desc" }
      ],
      take: options.limit
    });

    return items.map(toAiTask);
  }

  async listLatestAiTasksForConversations(conversationIds: string[]) {
    const uniqueConversationIds = [...new Set(conversationIds)];

    if (uniqueConversationIds.length === 0) {
      return [];
    }

    const conversationIdSql = Prisma.join(uniqueConversationIds.map((id) => Prisma.sql`${id}::uuid`));
    const rows = await this.db.$queryRaw<Array<{
      conversationId: string | null;
      type: AiTask["type"];
      status: AiTask["status"];
    }>>`
      SELECT
        "conversation_id" AS "conversationId",
        "type",
        "status"
      FROM (
        SELECT
          "conversation_id",
          "type",
          "status",
          "created_at",
          "id",
          ROW_NUMBER() OVER (
            PARTITION BY "conversation_id"
            ORDER BY "created_at" DESC, "id" DESC
          ) AS "rank"
        FROM "ai_tasks"
        WHERE "conversation_id" IN (${conversationIdSql})
      ) AS "latest_tasks"
      WHERE "rank" = 1
    `;

    return rows;
  }

  async findAiConversationById(id: string) {
    const conversation = await measureAiPerf("repository.ai_conversation.find_by_id", {
      conversationId: id
    }, () => this.db.aiConversation.findUnique({
      where: {
        id
      }
    }));

    return conversation ? toAiConversation(conversation) : null;
  }

  async createAiConversation(input: CreateAiConversationInput) {
    const conversation = await measureAiPerf("repository.ai_conversation.create", {
      mode: input.mode
    }, () => this.db.aiConversation.create({
      data: {
        userId: input.userId,
        mode: input.mode,
        title: input.title,
        targetPlatform: input.targetPlatform,
        sourcePlatform: input.sourcePlatform,
        status: input.status,
        uiState: input.uiState === undefined ? undefined : input.uiState === null ? Prisma.JsonNull : toJsonObject(input.uiState),
        lastMessageAt: toDate(input.lastMessageAt),
        createdAt: toDate(input.createdAt),
        updatedAt: toDate(input.updatedAt)
      }
    }));

    return toAiConversation(conversation);
  }

  async updateAiConversation(conversationId: string, input: UpdateAiConversationInput) {
    const conversation = await measureAiPerf("repository.ai_conversation.update", {
      conversationId
    }, () => this.db.aiConversation.update({
      where: {
        id: conversationId
      },
      data: {
        title: input.title,
        targetPlatform: input.targetPlatform,
        sourcePlatform: input.sourcePlatform,
        status: input.status,
        uiState: input.uiState === undefined ? undefined : input.uiState === null ? Prisma.JsonNull : toJsonObject(input.uiState),
        lastMessageAt: input.lastMessageAt ? toDate(input.lastMessageAt) : undefined,
        updatedAt: toDate(input.updatedAt)
      }
    }));

    return toAiConversation(conversation);
  }

  async listAiConversations(
    userId: string,
    pagination: AiConversationPagination,
    filters: { mode?: AiConversation["mode"]; status?: AiConversation["status"] }
  ) {
    const baseWhere: Prisma.AiConversationWhereInput = {
      userId,
      mode: filters.mode,
      status: filters.status
    };

    const orderBy = [
      { lastMessageAt: "desc" as const },
      { id: "desc" as const }
    ];
    const select = {
      id: true,
      userId: true,
      mode: true,
      title: true,
      targetPlatform: true,
      sourcePlatform: true,
      status: true,
      uiState: true,
      lastMessageAt: true,
      createdAt: true,
      updatedAt: true
    };

    if (pagination.mode === "cursor") {
      const cursor = pagination.cursor;
      const cursorDate = cursor ? toDate(cursor.createdAt) : null;
      const where: Prisma.AiConversationWhereInput = cursorDate
        ? {
            ...baseWhere,
            OR: [
              {
                lastMessageAt: {
                  lt: cursorDate
                }
              },
              {
                lastMessageAt: cursorDate,
                id: {
                  lt: cursor!.id
                }
              }
            ]
          }
        : baseWhere;
      const items = await this.db.aiConversation.findMany({
        where,
        orderBy,
        select,
        take: pagination.limit
      });

      return {
        items: items.map(toAiConversation)
      };
    }

    const where = baseWhere;
    const [items, total] = await Promise.all([
      this.db.aiConversation.findMany({
        where,
        orderBy,
        select,
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize
      }),
      this.db.aiConversation.count({
        where
      })
    ]);

    return {
      items: items.map(toAiConversation),
      total
    };
  }

  async createAiMessage(input: CreateAiMessageInput) {
    try {
      const message = await measureAiPerf("repository.ai_message.create", {
        conversationId: input.conversationId,
        role: input.role,
        hasTask: Boolean(input.taskId)
      }, () => this.db.aiMessage.create({
        data: {
          conversationId: input.conversationId,
          userId: input.userId,
          role: input.role,
          taskId: input.taskId,
          content: input.content,
          contentJson: input.contentJson === null ? Prisma.JsonNull : toJsonObject(input.contentJson),
          createdAt: toDate(input.createdAt)
        }
      }));

      return toAiMessage(message);
    } catch (error) {
      if (input.taskId && isUniqueConstraintError(error)) {
        const existing = await this.findAiMessageByTaskId(input.taskId);

        if (existing) {
          return existing;
        }
      }

      throw error;
    }
  }

  async findAiMessageByTaskId(taskId: string) {
    const message = await this.db.aiMessage.findUnique({
      where: {
        taskId
      }
    });

    return message ? toAiMessage(message) : null;
  }

  async listAiMessages(conversationId: string, options: AiMessageListOptions = {}) {
    const limit = options.limit && options.limit > 0 ? Math.min(options.limit, 100) : undefined;
    const direction = options.direction ?? "before";
    const cursor = options.cursor;
    const cursorDate = cursor ? toDate(cursor.createdAt) : null;
    const where: Prisma.AiMessageWhereInput = cursorDate
      ? {
          conversationId,
          OR: direction === "after"
            ? [
                {
                  createdAt: {
                    gt: cursorDate
                  }
                },
                {
                  createdAt: cursorDate,
                  id: {
                    gt: cursor!.id
                  }
                }
              ]
            : [
                {
                  createdAt: {
                    lt: cursorDate
                  }
                },
                {
                  createdAt: cursorDate,
                  id: {
                    lt: cursor!.id
                  }
                }
              ]
        }
      : {
          conversationId
        };
    const orderDirection = cursorDate && direction === "after"
      ? "asc"
      : limit || options.ascending === false
        ? "desc"
        : "asc";
    const records = await measureAiPerf("repository.ai_message.list", {
      conversationId,
      limit: limit ?? null,
      hasCursor: Boolean(cursor),
      direction
    }, () => this.db.aiMessage.findMany({
      where,
      orderBy: [
        { createdAt: orderDirection },
        { id: orderDirection }
      ],
      take: limit
    }));

    const ordered = orderDirection === "desc" && options.ascending !== false ? [...records].reverse() : records;

    return ordered.map(toAiMessage);
  }

  async createAiMessageAttachment(input: CreateAiMessageAttachmentInput) {
    try {
      const attachment = await measureAiPerf("repository.ai_message_attachment.create", {
        messageId: input.messageId,
        conversationId: input.conversationId
      }, () => this.db.aiMessageAttachment.create({
        data: {
          messageId: input.messageId,
          conversationId: input.conversationId,
          userId: input.userId,
          fileId: input.fileId,
          role: input.role,
          displayOrder: input.displayOrder,
          caption: input.caption,
          createdAt: toDate(input.createdAt)
        }
      }));

      return toAiMessageAttachment(attachment);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        const existing = await this.db.aiMessageAttachment.findFirst({
          where: {
            messageId: input.messageId,
            fileId: input.fileId,
            role: input.role
          }
        });

        if (existing) {
          return toAiMessageAttachment(existing);
        }
      }

      throw error;
    }
  }

  async listAiMessageAttachmentsForMessages(userId: string, messageIds: string[]) {
    if (messageIds.length === 0) {
      return [];
    }

    const attachments = await this.db.aiMessageAttachment.findMany({
      where: {
        userId,
        messageId: {
          in: messageIds
        }
      },
      include: {
        file: true
      },
      orderBy: [
        {
          messageId: "asc"
        },
        {
          displayOrder: "asc"
        }
      ]
    });

    return attachments.map(toAiMessageAttachmentSummary);
  }

  async createAiRunEvent(input: CreateAiRunEventInput) {
    try {
      const event = await measureAiPerf("repository.ai_run_event.create", {
        taskId: input.taskId,
        eventType: input.type,
        seq: input.seq
      }, () => this.db.aiRunEvent.create({
        data: {
          taskId: input.taskId,
          conversationId: input.conversationId,
          userId: input.userId,
          seq: input.seq,
          type: input.type,
          status: input.status,
          title: input.title,
          summary: input.summary,
          detailJson: input.detailJson === null ? Prisma.JsonNull : toJsonObject(input.detailJson),
          progressPercent: input.progressPercent,
          visibility: input.visibility,
          createdAt: toDate(input.createdAt)
        }
      }));

      return toAiRunEvent(event);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        const existing = await this.db.aiRunEvent.findUnique({
          where: {
            taskId_seq: {
              taskId: input.taskId,
              seq: input.seq
            }
          }
        });

        if (existing) {
          return toAiRunEvent(existing);
        }
      }

      throw error;
    }
  }

  async listAiRunEvents(taskId: string, options: { afterSeq?: number; limit?: number } = {}) {
    const limit = options.limit && options.limit > 0 ? Math.min(options.limit, 200) : 100;
    const events = await measureAiPerf("repository.ai_run_event.list", {
      taskId,
      limit,
      afterSeq: options.afterSeq ?? null
    }, () => this.db.aiRunEvent.findMany({
      where: {
        taskId,
        seq: options.afterSeq === undefined
          ? undefined
          : {
              gt: options.afterSeq
            },
        visibility: "public"
      },
      orderBy: {
        seq: "asc"
      },
      take: limit
    }));

    return events.map(toAiRunEvent);
  }

  async findLatestAiRunEvent(taskId: string) {
    const event = await measureAiPerf("repository.ai_run_event.find_latest", {
      taskId
    }, () => this.db.aiRunEvent.findFirst({
      where: {
        taskId
      },
      orderBy: {
        seq: "desc"
      }
    }));

    return event ? toAiRunEvent(event) : null;
  }

  async getNextRunEventSeq(taskId: string) {
    const result = await this.db.aiRunEvent.aggregate({
      where: {
        taskId
      },
      _max: {
        seq: true
      }
    });

    return (result._max.seq ?? 0) + 1;
  }

  async createUploadedFile(input: CreateUploadedFileInput) {
    const uploadedFile = await this.db.uploadedFile.create({
      data: {
        userId: input.userId,
        originalName: input.originalName,
        kind: input.kind ?? null,
        ext: input.ext,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        sha256: input.sha256,
        storageKey: input.storageKey ?? null,
        thumbnailKey: input.thumbnailKey ?? null,
        contentText: input.contentText,
        contentJson: input.contentJson ? toJsonObject(input.contentJson) : Prisma.JsonNull,
        parseStatus: input.parseStatus,
        scanStatus: input.scanStatus,
        riskFlags: input.riskFlags,
        createdAt: toDate(input.createdAt),
        updatedAt: toDate(input.updatedAt ?? input.createdAt)
      }
    });

    return toUploadedFile(uploadedFile);
  }

  async findUploadedFileById(id: string) {
    const uploadedFile = await measureAiPerf("repository.uploaded_file.find_by_id", {
      fileId: id
    }, () => this.db.uploadedFile.findUnique({
      where: {
        id
      }
    }));

    return uploadedFile ? toUploadedFile(uploadedFile) : null;
  }

  async listUploadedFilesByIds(fileIds: string[]) {
    const uniqueFileIds = [...new Set(fileIds)];

    if (uniqueFileIds.length === 0) {
      return [];
    }

    const uploadedFiles = await this.db.uploadedFile.findMany({
      where: {
        id: {
          in: uniqueFileIds
        }
      }
    });

    return uploadedFiles.map(toUploadedFile);
  }

  async getAdminOverview(todayStart: string): Promise<AdminOverview> {
    const todayStartDate = toDate(todayStart);
    const [
      users,
      paidUserOrders,
      creditTotals,
      todayAiTasks,
      todayResults,
      todayPaidOrderTotals,
      paidOrderTotals
    ] = await Promise.all([
      this.db.user.count(),
      this.db.rechargeOrder.findMany({
        where: {
          status: "PAID"
        },
        distinct: ["userId"],
        select: {
          userId: true
        }
      }),
      this.db.creditAccount.aggregate({
        _sum: {
          balance: true,
          totalEarned: true,
          totalSpent: true
        }
      }),
      this.db.aiTask.count({
        where: {
          createdAt: {
            gte: todayStartDate
          }
        }
      }),
      this.db.aiTaskResult.findMany({
        where: {
          task: {
            createdAt: {
              gte: todayStartDate
            }
          }
        },
        select: {
          tokenUsage: true
        }
      }),
      this.db.rechargeOrder.aggregate({
        where: {
          status: "PAID",
          createdAt: {
            gte: todayStartDate
          }
        },
        _count: {
          id: true
        },
        _sum: {
          amountCents: true
        }
      }),
      this.db.rechargeOrder.aggregate({
        where: {
          status: "PAID"
        },
        _count: {
          id: true
        },
        _sum: {
          amountCents: true
        }
      })
    ]);
    const paidUsers = paidUserOrders.length;

    return {
      totals: {
        users,
        paidUsers,
        paidConversionRate: users > 0 ? paidUsers / users : 0,
        creditBalance: creditTotals._sum.balance ?? 0,
        creditEarned: creditTotals._sum.totalEarned ?? 0,
        creditSpent: creditTotals._sum.totalSpent ?? 0,
        todayAiTasks,
        todayAiTokens: todayResults.reduce((total, item) => total + toTokenUsage(item.tokenUsage).totalTokens, 0),
        todayPaidOrders: todayPaidOrderTotals._count.id,
        todayPaidOrderAmountCents: todayPaidOrderTotals._sum.amountCents ?? 0,
        paidOrders: paidOrderTotals._count.id,
        paidOrderAmountCents: paidOrderTotals._sum.amountCents ?? 0
      }
    };
  }

  async listAdminUsers(pagination: { page: number; pageSize: number }, filters: AdminUserFilters): Promise<AdminUserPage> {
    const where = {
      phone: filters.phone
        ? {
            contains: filters.phone
          }
        : undefined,
      createdAt: filters.createdFrom || filters.createdTo
        ? {
            gte: filters.createdFrom ? toDate(filters.createdFrom) : undefined,
            lt: filters.createdTo ? toDate(filters.createdTo) : undefined
          }
        : undefined
    };
    const [items, total] = await Promise.all([
      this.db.user.findMany({
        where,
        include: {
          creditAccount: true,
          creditLedger: {
            orderBy: {
              createdAt: "desc"
            },
            take: 1
          }
        },
        orderBy: {
          createdAt: "desc"
        },
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize
      }),
      this.db.user.count({
        where
      })
    ]);

    return {
      items: items.map(toAdminUserItem),
      total
    };
  }

  async listAdminCreditLedger(pagination: { page: number; pageSize: number }, filters: AdminCreditLedgerFilters): Promise<AdminCreditLedgerPage> {
    const where = {
      type: filters.type,
      direction: filters.direction,
      createdAt: filters.createdFrom || filters.createdTo
        ? {
            gte: filters.createdFrom ? toDate(filters.createdFrom) : undefined,
            lt: filters.createdTo ? toDate(filters.createdTo) : undefined
          }
        : undefined,
      user: filters.phone
        ? {
            phone: {
              contains: filters.phone
            }
          }
        : undefined
    };
    const [items, total] = await Promise.all([
      this.db.creditLedger.findMany({
        where,
        include: {
          user: {
            select: {
              phone: true
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        },
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize
      }),
      this.db.creditLedger.count({
        where
      })
    ]);

    return {
      items: items.map(toAdminCreditLedgerItem),
      total
    };
  }

  async listAdminOrders(pagination: { page: number; pageSize: number }, filters: AdminOrderFilters): Promise<AdminOrderPage> {
    const where: Prisma.RechargeOrderWhereInput = {
      status: filters.status,
      createdAt: filters.createdFrom || filters.createdTo
        ? {
            gte: filters.createdFrom ? toDate(filters.createdFrom) : undefined,
            lt: filters.createdTo ? toDate(filters.createdTo) : undefined
          }
        : undefined,
      user: filters.phone
        ? {
            phone: {
              contains: filters.phone
            }
          }
        : undefined
    };
    const paidWhere: Prisma.RechargeOrderWhereInput | null = filters.status && filters.status !== "PAID"
      ? null
      : {
          ...where,
          status: "PAID"
        };
    const [items, totals, paidTotals] = await Promise.all([
      this.db.rechargeOrder.findMany({
        where,
        include: {
          user: true,
          plan: true,
          transactions: {
            orderBy: {
              createdAt: "desc"
            },
            take: 1
          }
        },
        orderBy: {
          createdAt: "desc"
        },
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize
      }),
      this.db.rechargeOrder.aggregate({
        where,
        _count: {
          id: true
        },
        _sum: {
          amountCents: true
        }
      }),
      paidWhere
        ? this.db.rechargeOrder.aggregate({
            where: paidWhere,
            _count: {
              id: true
            },
            _sum: {
              amountCents: true
            }
          })
        : Promise.resolve(null)
    ]);

    return {
      items: items.map(toAdminOrderItem),
      total: totals._count.id,
      summary: {
        filteredOrders: totals._count.id,
        filteredOrderAmountCents: totals._sum.amountCents ?? 0,
        filteredPaidOrders: paidTotals?._count.id ?? 0,
        filteredPaidOrderAmountCents: paidTotals?._sum.amountCents ?? 0
      }
    };
  }

  async listAdminAiTasks(pagination: { page: number; pageSize: number }, filters: { type?: AiTask["type"]; status?: AiTask["status"] }): Promise<AdminAiTaskPage> {
    const where = {
      type: filters.type,
      status: filters.status
    };
    const [items, total] = await Promise.all([
      this.db.aiTask.findMany({
        where,
        include: {
          user: true,
          result: true
        },
        orderBy: {
          createdAt: "desc"
        },
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize
      }),
      this.db.aiTask.count({
        where
      })
    ]);

    return {
      items: items.map(toAdminAiTaskItem),
      total
    };
  }

  async listAdminUploadedFiles(pagination: { page: number; pageSize: number }, filters: { scanStatus?: UploadedFile["scanStatus"] }): Promise<AdminUploadedFilePage> {
    const where = {
      scanStatus: filters.scanStatus
    };
    const [items, total] = await Promise.all([
      this.db.uploadedFile.findMany({
        where,
        include: {
          user: true
        },
        orderBy: {
          createdAt: "desc"
        },
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize
      }),
      this.db.uploadedFile.count({
        where
      })
    ]);

    return {
      items: items.map(toAdminUploadedFileItem),
      total
    };
  }

  async listAdminContactRequests(pagination: { page: number; pageSize: number }, filters: AdminContactRequestFilters): Promise<AdminContactRequestPage> {
    const where: Prisma.ContactRequestWhereInput = {
      contactMethod: filters.contactMethod,
      category: filters.category,
      source: filters.source
        ? {
            contains: filters.source
          }
        : undefined,
      createdAt: filters.createdFrom || filters.createdTo
        ? {
            gte: filters.createdFrom ? toDate(filters.createdFrom) : undefined,
            lt: filters.createdTo ? toDate(filters.createdTo) : undefined
          }
        : undefined,
      OR: filters.keyword
        ? [
            {
              userPhone: {
                contains: filters.keyword
              }
            },
            {
              contactValue: {
                contains: filters.keyword
              }
            },
            {
              name: {
                contains: filters.keyword
              }
            }
          ]
        : undefined
    };
    const [items, total] = await Promise.all([
      this.db.contactRequest.findMany({
        where,
        orderBy: {
          createdAt: "desc"
        },
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize
      }),
      this.db.contactRequest.count({
        where
      })
    ]);

    return {
      items: items.map(toAdminContactRequestItem),
      total
    };
  }

  async findCreditReservationByIdempotencyKey(idempotencyKey: string) {
    const reservation = await measureAiPerf("repository.credit_reservation.find_by_idempotency", {}, () => this.db.creditReservation.findUnique({
      where: {
        idempotencyKey
      }
    }));

    return reservation ? toCreditReservation(reservation) : null;
  }

  async findCreditReservationByTaskId(taskId: string) {
    const reservation = await this.db.creditReservation.findUnique({
      where: {
        taskId
      }
    });

    return reservation ? toCreditReservation(reservation) : null;
  }

  async createCreditReservation(input: CreateCreditReservationInput) {
    return this.withTransaction(async (repository) => repository.createCreditReservationInTransaction(input));
  }

  private async createCreditReservationInTransaction(input: CreateCreditReservationInput) {
    const existing = await this.findCreditReservationByIdempotencyKey(input.idempotencyKey);

    if (existing) {
      return existing;
    }

    const account = await measureAiPerf("repository.credit_account.lock_and_read", {
      taskId: input.taskId
    }, () => lockCreditAccount(this.db, input.userId, input.createdAt));
    const activeReserved = await this.getActiveReservedAmount(input.userId);

    if (account.balance - activeReserved < input.amount) {
      throw new ApiError("INSUFFICIENT_CREDITS", "积分余额不足，请先充值", 402);
    }

    try {
      const reservation = await measureAiPerf("repository.credit_reservation.create", {
        taskId: input.taskId,
        amount: input.amount
      }, () => this.db.creditReservation.create({
        data: {
          userId: input.userId,
          taskId: input.taskId,
          amount: input.amount,
          status: input.status,
          idempotencyKey: input.idempotencyKey,
          expiresAt: toDate(input.expiresAt),
          createdAt: toDate(input.createdAt),
          updatedAt: toDate(input.updatedAt)
        }
      }));

      return toCreditReservation(reservation);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        const reservation = await this.findCreditReservationByIdempotencyKey(input.idempotencyKey);

        if (reservation) {
          return reservation;
        }
      }

      throw error;
    }
  }

  async updateCreditReservationStatus(id: string, status: CreditReservation["status"], updatedAt: string) {
    const reservation = await this.db.creditReservation.update({
      where: {
        id
      },
      data: {
        status,
        updatedAt: toDate(updatedAt)
      }
    });

    return toCreditReservation(reservation);
  }

  async getActiveReservedAmount(userId: string) {
    const result = await measureAiPerf("repository.credit_reservation.active_reserved", {}, () => this.db.creditReservation.aggregate({
      where: {
        userId,
        status: "RESERVED"
      },
      _sum: {
        amount: true
      }
    }));

    return result._sum.amount ?? 0;
  }
}

async function lockCreditAccount(db: PrismaDb, userId: string, createdAt?: string) {
  const rows = await db.$queryRaw<Array<{ balance: number }>>(
    Prisma.sql`SELECT balance FROM credit_accounts WHERE user_id = ${userId}::uuid FOR UPDATE`
  );

  if (rows[0]) {
    return {
      balance: rows[0].balance
    };
  }

  if (!createdAt) {
    throw new ApiError("NOT_FOUND", "Credit account not found", 404);
  }

  try {
    const account = await db.creditAccount.create({
      data: {
        userId,
        balance: 0,
        totalEarned: 0,
        totalSpent: 0,
        version: 0,
        updatedAt: toDate(createdAt)
      }
    });

    return {
      balance: account.balance
    };
  } catch (error) {
    if (!isUniqueConstraintError(error)) {
      throw error;
    }

    return lockCreditAccount(db, userId);
  }
}

function isRootPrismaClient(db: PrismaDb): db is PrismaClient {
  return "$transaction" in db;
}

function toDate(value: string) {
  return new Date(value);
}

function toIso(value: Date) {
  return value.toISOString();
}

function toUser(user: {
  id: string;
  phone: string;
  displayName: string;
  inviteCode: string;
  referredBy: string | null;
  status: User["status"];
  createdAt: Date;
  lastLoginAt: Date;
}): User {
  return {
    id: user.id,
    phone: user.phone,
    displayName: user.displayName,
    inviteCode: user.inviteCode,
    referredBy: user.referredBy,
    status: user.status,
    createdAt: toIso(user.createdAt),
    lastLoginAt: toIso(user.lastLoginAt)
  };
}

function toUserLegalConsent(consent: {
  id: string;
  userId: string;
  agreementVersion: string;
  privacyVersion: string;
  agreedAt: Date;
  requestIp: string | null;
  userAgent: string | null;
  source: string;
}): UserLegalConsent {
  return {
    id: consent.id,
    userId: consent.userId,
    agreementVersion: consent.agreementVersion,
    privacyVersion: consent.privacyVersion,
    agreedAt: toIso(consent.agreedAt),
    requestIp: consent.requestIp,
    userAgent: consent.userAgent,
    source: consent.source
  };
}

function toContactRequest(request: {
  id: string;
  userId: string | null;
  userPhone: string | null;
  name: string;
  contactMethod: string;
  contactValue: string;
  category: string;
  message: string;
  source: string;
  requestIp: string | null;
  userAgent: string | null;
  createdAt: Date;
  updatedAt: Date;
}): ContactRequest {
  return {
    id: request.id,
    userId: request.userId,
    userPhone: request.userPhone,
    name: request.name,
    contactMethod: request.contactMethod as ContactRequest["contactMethod"],
    contactValue: request.contactValue,
    category: request.category as ContactRequest["category"],
    message: request.message,
    source: request.source,
    requestIp: request.requestIp,
    userAgent: request.userAgent,
    createdAt: toIso(request.createdAt),
    updatedAt: toIso(request.updatedAt)
  };
}

function toAiModelProfile(profile: {
  id: string;
  name: string;
  provider: string;
  baseUrl: string;
  model: string;
  supportsVision: boolean;
  apiKeyEnvName: string | null;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}): AiModelProfile {
  return {
    id: profile.id,
    name: profile.name,
    provider: profile.provider as AiModelProfile["provider"],
    baseUrl: profile.baseUrl,
    model: profile.model,
    supportsVision: profile.supportsVision,
    apiKeyEnvName: profile.apiKeyEnvName,
    enabled: profile.enabled,
    createdAt: toIso(profile.createdAt),
    updatedAt: toIso(profile.updatedAt)
  };
}

function toUserMembership(membership: {
  id: string;
  userId: string;
  type: UserMembership["type"];
  status: UserMembership["status"];
  startsAt: Date;
  endsAt: Date;
  sourceType: string;
  sourceId: string;
  createdAt: Date;
  updatedAt: Date;
}): UserMembership {
  return {
    id: membership.id,
    userId: membership.userId,
    type: membership.type,
    status: membership.status,
    startsAt: toIso(membership.startsAt),
    endsAt: toIso(membership.endsAt),
    sourceType: membership.sourceType,
    sourceId: membership.sourceId,
    createdAt: toIso(membership.createdAt),
    updatedAt: toIso(membership.updatedAt)
  };
}

function toSmsCode(record: {
  id: string;
  phone: string;
  scene: SmsCodeRecord["scene"];
  codeHash: string | null;
  mockCode: string | null;
  expiresAt: Date;
  usedAt: Date | null;
  requestIp: string | null;
  failedAttempts: number;
  lastFailedAt: Date | null;
  createdAt: Date;
}): SmsCodeRecord {
  return {
    id: record.id,
    phone: record.phone,
    scene: record.scene,
    codeHash: record.codeHash,
    mockCode: record.mockCode,
    expiresAt: toIso(record.expiresAt),
    usedAt: record.usedAt ? toIso(record.usedAt) : null,
    requestIp: record.requestIp,
    failedAttempts: record.failedAttempts,
    lastFailedAt: record.lastFailedAt ? toIso(record.lastFailedAt) : null,
    createdAt: toIso(record.createdAt)
  };
}

function toCreditAccount(account: {
  userId: string;
  balance: number;
  totalEarned: number;
  totalSpent: number;
  version: number;
  updatedAt: Date;
}): CreditAccount {
  return {
    userId: account.userId,
    balance: account.balance,
    totalEarned: account.totalEarned,
    totalSpent: account.totalSpent,
    version: account.version,
    updatedAt: toIso(account.updatedAt)
  };
}

function toCreditLedger(ledger: {
  id: string;
  userId: string;
  requestId: string;
  scene: string;
  type: CreditLedger["type"];
  direction: CreditLedger["direction"];
  amount: number;
  balanceAfter: number;
  status: CreditLedger["status"];
  sourceType: string;
  sourceId: string;
  idempotencyKey: string;
  remark: string;
  createdAt: Date;
}): CreditLedger {
  return {
    id: ledger.id,
    userId: ledger.userId,
    requestId: ledger.requestId,
    scene: ledger.scene,
    type: ledger.type,
    direction: ledger.direction,
    amount: ledger.amount,
    balanceAfter: ledger.balanceAfter,
    status: ledger.status,
    sourceType: ledger.sourceType,
    sourceId: ledger.sourceId,
    idempotencyKey: ledger.idempotencyKey,
    remark: ledger.remark,
    createdAt: toIso(ledger.createdAt)
  };
}

function toRechargePlan(plan: {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  points: number;
  bonusPoints: number;
  totalPoints: number;
  enabled: boolean;
  sort: number;
  createdAt: Date;
  updatedAt: Date;
}): RechargePlan {
  return {
    id: plan.id,
    name: plan.name,
    description: plan.description,
    priceCents: plan.priceCents,
    points: plan.points,
    bonusPoints: plan.bonusPoints,
    totalPoints: plan.totalPoints,
    enabled: plan.enabled,
    sort: plan.sort,
    createdAt: toIso(plan.createdAt),
    updatedAt: toIso(plan.updatedAt)
  };
}

function toRechargeOrder(order: {
  id: string;
  orderNo: string;
  userId: string;
  planId: string;
  amountCents: number;
  points: number;
  bonusPoints: number;
  totalPoints: number;
  payChannel: RechargeOrder["payChannel"];
  status: RechargeOrder["status"];
  clientRequestId: string;
  paidAt: Date | null;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): RechargeOrder {
  return {
    id: order.id,
    orderNo: order.orderNo,
    userId: order.userId,
    planId: order.planId,
    amountCents: order.amountCents,
    points: order.points,
    bonusPoints: order.bonusPoints,
    totalPoints: order.totalPoints,
    payChannel: order.payChannel,
    status: order.status,
    clientRequestId: order.clientRequestId,
    paidAt: order.paidAt ? toIso(order.paidAt) : null,
    closedAt: order.closedAt ? toIso(order.closedAt) : null,
    createdAt: toIso(order.createdAt),
    updatedAt: toIso(order.updatedAt)
  };
}

function toPaymentTransaction(transaction: {
  id: string;
  orderId: string;
  provider: PaymentTransaction["provider"];
  providerTradeNo: string;
  notifyId: string;
  amountCents: number;
  status: PaymentTransaction["status"];
  rawPayload: Prisma.JsonValue;
  idempotencyKey: string;
  verifiedAt: Date | null;
  failedReason: string | null;
  orderStatusBefore: PaymentTransaction["orderStatusBefore"];
  orderStatusAfter: PaymentTransaction["orderStatusAfter"];
  createdAt: Date;
}): PaymentTransaction {
  return {
    id: transaction.id,
    orderId: transaction.orderId,
    provider: transaction.provider,
    providerTradeNo: transaction.providerTradeNo,
    notifyId: transaction.notifyId,
    amountCents: transaction.amountCents,
    status: transaction.status,
    rawPayload: toRecord(transaction.rawPayload),
    idempotencyKey: transaction.idempotencyKey,
    verifiedAt: transaction.verifiedAt ? toIso(transaction.verifiedAt) : null,
    failedReason: transaction.failedReason,
    orderStatusBefore: transaction.orderStatusBefore,
    orderStatusAfter: transaction.orderStatusAfter,
    createdAt: toIso(transaction.createdAt)
  };
}

function toUploadedFile(uploadedFile: {
  id: string;
  userId: string;
  originalName: string;
  kind: string | null;
  ext: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  storageKey: string | null;
  thumbnailKey: string | null;
  contentText: string | null;
  contentJson: Prisma.JsonValue | null;
  parseStatus: UploadedFile["parseStatus"];
  scanStatus: UploadedFile["scanStatus"];
  riskFlags: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date | null;
}): UploadedFile {
  return {
    id: uploadedFile.id,
    userId: uploadedFile.userId,
    originalName: uploadedFile.originalName,
    kind: normalizeUploadedFileKind(uploadedFile.kind, uploadedFile.ext, uploadedFile.mimeType),
    ext: uploadedFile.ext,
    mimeType: uploadedFile.mimeType,
    sizeBytes: uploadedFile.sizeBytes,
    sha256: uploadedFile.sha256,
    storageKey: uploadedFile.storageKey,
    thumbnailKey: uploadedFile.thumbnailKey,
    contentText: uploadedFile.contentText,
    contentJson: uploadedFile.contentJson ? toRecord(uploadedFile.contentJson) : null,
    parseStatus: uploadedFile.parseStatus,
    scanStatus: uploadedFile.scanStatus,
    riskFlags: toStringArray(uploadedFile.riskFlags),
    createdAt: toIso(uploadedFile.createdAt),
    updatedAt: uploadedFile.updatedAt ? toIso(uploadedFile.updatedAt) : null
  };
}

function toAdminUserItem(user: {
  id: string;
  phone: string;
  displayName: string;
  status: User["status"];
  createdAt: Date;
  lastLoginAt: Date;
  creditAccount: {
    balance: number;
    totalEarned: number;
    totalSpent: number;
  } | null;
  creditLedger: Array<{
    direction: CreditLedger["direction"];
    amount: number;
    remark: string;
    createdAt: Date;
  }>;
}): AdminUserPage["items"][number] {
  const latestLedger = user.creditLedger[0] ?? null;

  return {
    id: user.id,
    phone: user.phone,
    displayName: user.displayName,
    status: user.status,
    createdAt: toIso(user.createdAt),
    lastLoginAt: toIso(user.lastLoginAt),
    creditBalance: user.creditAccount?.balance ?? 0,
    totalEarned: user.creditAccount?.totalEarned ?? 0,
    totalSpent: user.creditAccount?.totalSpent ?? 0,
    latestLedger: latestLedger
      ? {
          amount: latestLedger.amount,
          direction: latestLedger.direction,
          remark: latestLedger.remark,
          createdAt: toIso(latestLedger.createdAt)
        }
      : null
  };
}

function toAdminCreditLedgerItem(ledger: {
  id: string;
  direction: CreditLedger["direction"];
  type: CreditLedger["type"];
  amount: number;
  balanceAfter: number;
  sourceType: string;
  sourceId: string;
  remark: string;
  createdAt: Date;
  user: {
    phone: string;
  };
}): AdminCreditLedgerPage["items"][number] {
  return {
    id: ledger.id,
    userPhone: ledger.user.phone,
    direction: ledger.direction,
    type: ledger.type,
    amount: ledger.amount,
    balanceAfter: ledger.balanceAfter,
    sourceType: ledger.sourceType,
    sourceId: ledger.sourceId,
    remark: ledger.remark,
    createdAt: toIso(ledger.createdAt)
  };
}

function toAdminOrderItem(order: {
  id: string;
  orderNo: string;
  amountCents: number;
  points: number;
  bonusPoints: number;
  totalPoints: number;
  payChannel: RechargeOrder["payChannel"];
  status: RechargeOrder["status"];
  clientRequestId: string;
  createdAt: Date;
  paidAt: Date | null;
  closedAt: Date | null;
  user: {
    phone: string;
  };
  plan: {
    name: string;
  };
  transactions: Array<{
    status: PaymentTransaction["status"];
    providerTradeNo: string;
    failedReason: string | null;
  }>;
}): AdminOrderPage["items"][number] {
  const createdAt = toIso(order.createdAt);
  const latestTransaction = order.transactions[0] ?? null;

  return {
    id: order.id,
    orderNo: order.orderNo,
    userPhone: order.user.phone,
    planName: order.plan.name,
    amountCents: order.amountCents,
    points: order.points,
    bonusPoints: order.bonusPoints,
    totalPoints: order.totalPoints,
    payChannel: order.payChannel,
    paymentActionType: toPaymentActionType(order.payChannel),
    status: order.status,
    clientRequestId: order.clientRequestId,
    createdAt,
    paidAt: order.paidAt ? toIso(order.paidAt) : null,
    closedAt: order.closedAt ? toIso(order.closedAt) : null,
    expiresAt: getOrderExpiresAt(createdAt),
    expired: order.status === "PENDING" && isOrderExpired(createdAt),
    latestPaymentStatus: latestTransaction?.status ?? null,
    latestPaymentProviderTradeNo: latestTransaction?.providerTradeNo ?? null,
    latestPaymentFailedReason: latestTransaction?.failedReason ?? null
  };
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

function toAdminAiTaskItem(task: {
  id: string;
  type: AiTask["type"];
  status: AiTask["status"];
  scopeStatus: AiTask["scopeStatus"];
  costPoints: number;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: Date;
  finishedAt: Date | null;
  user: {
    phone: string;
  };
  result: {
    model: string;
    tokenUsage: Prisma.JsonValue;
  } | null;
}): AdminAiTaskPage["items"][number] {
  return {
    id: task.id,
    userPhone: task.user.phone,
    type: task.type,
    status: task.status,
    scopeStatus: task.scopeStatus,
    costPoints: task.costPoints,
    model: task.result?.model ?? null,
    tokenUsage: task.result ? toTokenUsage(task.result.tokenUsage) : null,
    errorCode: task.errorCode,
    errorMessage: truncateText(task.errorMessage, 160),
    createdAt: toIso(task.createdAt),
    finishedAt: task.finishedAt ? toIso(task.finishedAt) : null
  };
}

function toAdminUploadedFileItem(file: {
  id: string;
  originalName: string;
  ext: string;
  sizeBytes: number;
  sha256: string;
  scanStatus: UploadedFile["scanStatus"];
  riskFlags: Prisma.JsonValue;
  createdAt: Date;
  user: {
    phone: string;
  };
}): AdminUploadedFilePage["items"][number] {
  return {
    id: file.id,
    userPhone: file.user.phone,
    originalName: file.originalName,
    ext: file.ext,
    sizeBytes: file.sizeBytes,
    sha256Prefix: file.sha256.slice(0, 12),
    scanStatus: file.scanStatus,
    riskFlags: toStringArray(file.riskFlags),
    createdAt: toIso(file.createdAt)
  };
}

function toAdminContactRequestItem(request: {
  id: string;
  userPhone: string | null;
  name: string;
  contactMethod: string;
  contactValue: string;
  category: string;
  message: string;
  source: string;
  createdAt: Date;
}): AdminContactRequestPage["items"][number] {
  return {
    id: request.id,
    userPhone: request.userPhone,
    name: request.name,
    contactMethod: request.contactMethod as AdminContactRequestPage["items"][number]["contactMethod"],
    contactValue: request.contactValue,
    category: request.category as AdminContactRequestPage["items"][number]["category"],
    message: request.message,
    source: request.source,
    createdAt: toIso(request.createdAt)
  };
}

function toAiConversation(conversation: {
  id: string;
  userId: string;
  mode: AiConversation["mode"];
  title: string;
  targetPlatform: string | null;
  sourcePlatform: string | null;
  status: AiConversation["status"];
  uiState: Prisma.JsonValue | null;
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
}): AiConversation {
  return {
    id: conversation.id,
    userId: conversation.userId,
    mode: conversation.mode,
    title: conversation.title,
    targetPlatform: conversation.targetPlatform,
    sourcePlatform: conversation.sourcePlatform,
    status: conversation.status,
    uiState: conversation.uiState === null ? null : toRecord(conversation.uiState),
    lastMessageAt: toIso(conversation.lastMessageAt),
    createdAt: toIso(conversation.createdAt),
    updatedAt: toIso(conversation.updatedAt)
  };
}

function toAiMessage(message: {
  id: string;
  conversationId: string;
  userId: string;
  role: AiMessage["role"];
  taskId: string | null;
  content: string;
  contentJson: Prisma.JsonValue | null;
  createdAt: Date;
}): AiMessage {
  return {
    id: message.id,
    conversationId: message.conversationId,
    userId: message.userId,
    role: message.role,
    taskId: message.taskId,
    content: message.content,
    contentJson: message.contentJson === null ? null : toRecord(message.contentJson),
    createdAt: toIso(message.createdAt)
  };
}

function toAiMessageAttachment(attachment: {
  id: string;
  messageId: string;
  conversationId: string;
  userId: string;
  fileId: string;
  role: AiMessageAttachment["role"];
  displayOrder: number;
  caption: string | null;
  createdAt: Date;
}): AiMessageAttachment {
  return {
    id: attachment.id,
    messageId: attachment.messageId,
    conversationId: attachment.conversationId,
    userId: attachment.userId,
    fileId: attachment.fileId,
    role: attachment.role,
    displayOrder: attachment.displayOrder,
    caption: attachment.caption,
    createdAt: toIso(attachment.createdAt)
  };
}

function toAiMessageAttachmentSummary(attachment: {
  id: string;
  messageId: string;
  conversationId: string;
  userId: string;
  fileId: string;
  role: AiMessageAttachment["role"];
  displayOrder: number;
  caption: string | null;
  createdAt: Date;
  file: {
    id: string;
    kind: string | null;
    originalName: string;
    ext: string;
    mimeType: string;
    sizeBytes: number;
    thumbnailKey: string | null;
    contentText: string | null;
    contentJson: Prisma.JsonValue | null;
    scanStatus: AiMessageAttachmentSummary["file"]["scanStatus"];
    riskFlags: Prisma.JsonValue;
    createdAt: Date;
  };
}): AiMessageAttachmentSummary {
  return {
    ...toAiMessageAttachment(attachment),
    file: {
      fileId: attachment.file.id,
      kind: normalizeUploadedFileKind(attachment.file.kind, attachment.file.ext, attachment.file.mimeType),
      originalName: attachment.file.originalName,
      ext: attachment.file.ext,
      mimeType: attachment.file.mimeType,
      sizeBytes: attachment.file.sizeBytes,
      scanStatus: attachment.file.scanStatus,
      riskFlags: toStringArray(attachment.file.riskFlags),
      contentPreview: createContentPreview(attachment.file.contentText, attachment.file),
      hasThumbnail: Boolean(attachment.file.thumbnailKey),
      createdAt: toIso(attachment.file.createdAt)
    }
  };
}

function toAiRunEvent(event: {
  id: string;
  taskId: string;
  conversationId: string | null;
  userId: string;
  seq: number;
  type: string;
  status: AiRunEvent["status"];
  title: string;
  summary: string | null;
  detailJson: Prisma.JsonValue | null;
  progressPercent: number | null;
  visibility: AiRunEvent["visibility"];
  createdAt: Date;
}): AiRunEvent {
  return {
    id: event.id,
    taskId: event.taskId,
    conversationId: event.conversationId,
    userId: event.userId,
    seq: event.seq,
    type: event.type,
    status: event.status,
    title: event.title,
    summary: event.summary,
    detailJson: event.detailJson === null ? null : toRecord(event.detailJson),
    progressPercent: event.progressPercent,
    visibility: event.visibility,
    createdAt: toIso(event.createdAt)
  };
}

function toAiTask(task: {
  id: string;
  userId: string;
  conversationId: string | null;
  type: AiTask["type"];
  status: AiTask["status"];
  scopeStatus: AiTask["scopeStatus"];
  sourcePlatform: string | null;
  targetPlatform: string | null;
  prompt: string | null;
  inputCode: string | null;
  inputFileId: string | null;
  costPoints: number;
  clientRequestId: string;
  requestId: string;
  errorCode: string | null;
  errorMessage: string | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): AiTask {
  return {
    id: task.id,
    userId: task.userId,
    conversationId: task.conversationId,
    type: task.type,
    status: task.status,
    scopeStatus: task.scopeStatus,
    sourcePlatform: task.sourcePlatform,
    targetPlatform: task.targetPlatform,
    prompt: task.prompt,
    inputCode: task.inputCode,
    inputFileId: task.inputFileId,
    costPoints: task.costPoints,
    clientRequestId: task.clientRequestId,
    requestId: task.requestId,
    errorCode: task.errorCode,
    errorMessage: task.errorMessage,
    startedAt: task.startedAt ? toIso(task.startedAt) : null,
    finishedAt: task.finishedAt ? toIso(task.finishedAt) : null,
    createdAt: toIso(task.createdAt),
    updatedAt: toIso(task.updatedAt)
  };
}

function toAiTaskResult(result: {
  taskId: string;
  resultType: AiTaskResult["resultType"];
  scopeStatus: AiTaskResult["scopeStatus"];
  generatedCode: string | null;
  explanation: string | null;
  migrationNotes: string | null;
  riskWarnings: Prisma.JsonValue;
  reportJson: Prisma.JsonValue | null;
  model: string;
  tokenUsage: Prisma.JsonValue;
  createdAt: Date;
}): AiTaskResult {
  return {
    taskId: result.taskId,
    resultType: result.resultType,
    scopeStatus: result.scopeStatus,
    generatedCode: result.generatedCode,
    explanation: result.explanation,
    migrationNotes: result.migrationNotes,
    riskWarnings: toStringArray(result.riskWarnings),
    reportJson: result.reportJson === null ? null : toRecord(result.reportJson),
    model: result.model,
    tokenUsage: toTokenUsage(result.tokenUsage),
    createdAt: toIso(result.createdAt)
  };
}

function toCreditReservation(reservation: {
  id: string;
  userId: string;
  taskId: string;
  amount: number;
  status: CreditReservation["status"];
  idempotencyKey: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}): CreditReservation {
  return {
    id: reservation.id,
    userId: reservation.userId,
    taskId: reservation.taskId,
    amount: reservation.amount,
    status: reservation.status,
    idempotencyKey: reservation.idempotencyKey,
    expiresAt: toIso(reservation.expiresAt),
    createdAt: toIso(reservation.createdAt),
    updatedAt: toIso(reservation.updatedAt)
  };
}

function toRecord(value: Prisma.JsonValue): Record<string, unknown> {
  return isObject(value) ? value : {};
}

function toJsonObject(value: Record<string, unknown>): Prisma.InputJsonObject {
  return value as Prisma.InputJsonObject;
}

function createContentPreview(text: string | null, file?: { originalName: string; ext: string; mimeType: string }) {
  if (text) {
    return text.length > 800 ? `${text.slice(0, 800)}...` : text;
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

function normalizeUploadedFileKind(kind: string | null, ext: string, mimeType: string): UploadedFile["kind"] {
  if (kind === "code" || kind === "text" || kind === "log" || kind === "markdown" || kind === "image") {
    return kind;
  }

  return inferUploadedFileKind(ext, mimeType);
}

function toStringArray(value: Prisma.JsonValue) {
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

function toTokenUsage(value: Prisma.JsonValue) {
  const record = toRecord(value);

  return {
    promptTokens: Number(record.promptTokens ?? 0),
    completionTokens: Number(record.completionTokens ?? 0),
    totalTokens: Number(record.totalTokens ?? 0)
  };
}

function truncateText(value: string | null, maxLength: number) {
  if (!value || value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}...`;
}

function isObject(value: Prisma.JsonValue): value is Prisma.JsonObject {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isUniqueConstraintError(error: unknown) {
  return isPrismaError(error, "P2002");
}

function isPrismaError(error: unknown, code: string) {
  return Boolean(error && typeof error === "object" && "code" in error && (error as { code?: string }).code === code);
}
