import { randomUUID } from "crypto";
import type {
  AiTask,
  AiConversation,
  AiMessage,
  AiMessageAttachment,
  AiMessageAttachmentSummary,
  AiRunEvent,
  AiTaskResult,
  CreditAccount,
  CreditLedger,
  CreditReservation,
  PaymentTransaction,
  RechargeOrder,
  RechargePlan,
  SmsCodeRecord,
  UploadedFile,
  User,
  UserLegalConsent
} from "@/server/domain";
import { ApiError } from "@/server/http/api-response";
import { getOrderExpiresAt, isOrderExpired } from "@/server/payments/payment-config";
import type {
  AiTaskPage,
  AdminAiTaskPage,
  AdminOrderPage,
  AdminOverview,
  AdminUploadedFilePage,
  AdminUserPage,
  AiConversationPagination,
  AiMessageListOptions,
  AppliedCreditLedger,
  ApplyCreditLedgerInput,
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
  UpdateAiConversationInput,
  UpdateAiTaskInput
} from "@/server/repositories/types";

const MOCK_PLAN_TIMESTAMP = "2026-01-01T00:00:00.000Z";

const mockRechargePlans: RechargePlan[] = [
  {
    id: "starter",
    name: "入门包",
    description: "适合轻量体验与少量策略生成",
    priceCents: 990,
    points: 1000,
    bonusPoints: 0,
    totalPoints: 1000,
    enabled: true,
    sort: 10,
    createdAt: MOCK_PLAN_TIMESTAMP,
    updatedAt: MOCK_PLAN_TIMESTAMP
  },
  {
    id: "standard",
    name: "标准包",
    description: "推荐日常使用，含 500 赠送积分",
    priceCents: 2990,
    points: 3000,
    bonusPoints: 500,
    totalPoints: 3500,
    enabled: true,
    sort: 20,
    createdAt: MOCK_PLAN_TIMESTAMP,
    updatedAt: MOCK_PLAN_TIMESTAMP
  },
  {
    id: "pro",
    name: "专业包",
    description: "适合高频转换与策略迭代，含 1,000 赠送积分",
    priceCents: 5990,
    points: 7000,
    bonusPoints: 1000,
    totalPoints: 8000,
    enabled: true,
    sort: 30,
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
  private readonly smsCodes = new Map<string, SmsCodeRecord>();
  private readonly creditAccounts = new Map<string, CreditAccount>();
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
  private readonly creditReservations = new Map<string, CreditReservation>();
  private readonly creditReservationsByIdempotencyKey = new Map<string, string>();
  private readonly creditReservationsByTaskId = new Map<string, string>();

  async createSmsCode(input: CreateSmsCodeInput) {
    const record: SmsCodeRecord = {
      id: randomUUID(),
      ...input,
      usedAt: null
    };

    this.smsCodes.set(record.id, record);
    return record;
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
      updatedAt: now
    };

    this.creditAccounts.set(userId, account);
    return account;
  }

  async applyCreditLedger(input: ApplyCreditLedgerInput): Promise<AppliedCreditLedger> {
    const existingLedgerId = this.ledgerByIdempotencyKey.get(input.idempotencyKey);

    if (existingLedgerId) {
      const ledger = this.creditLedger.get(existingLedgerId);
      const account = await this.ensureCreditAccount(input.userId, input.createdAt);

      if (ledger) {
        return {
          account,
          ledger,
          duplicated: true
        };
      }
    }

    const previousAccount = await this.ensureCreditAccount(input.userId, input.createdAt);
    const signedAmount = input.direction === "in" ? input.amount : -input.amount;
    const account: CreditAccount = {
      ...previousAccount,
      balance: previousAccount.balance + signedAmount,
      totalEarned: input.direction === "in" ? previousAccount.totalEarned + input.amount : previousAccount.totalEarned,
      totalSpent: input.direction === "out" ? previousAccount.totalSpent + input.amount : previousAccount.totalSpent,
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

    return {
      account,
      ledger,
      duplicated: false
    };
  }

  async listCreditLedger(userId: string, pagination: { page: number; pageSize: number }): Promise<LedgerPage> {
    const allItems = [...this.creditLedger.values()]
      .filter((item) => item.userId === userId)
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
      .sort((left, right) => options.ascending ? left.createdAt.localeCompare(right.createdAt) : right.createdAt.localeCompare(left.createdAt));

    return typeof options.limit === "number" ? items.slice(0, options.limit) : items;
  }

  async findAiConversationById(id: string) {
    return this.aiConversations.get(id) ?? null;
  }

  async createAiConversation(input: CreateAiConversationInput) {
    const conversation: AiConversation = {
      id: randomUUID(),
      ...input
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

  async getAdminOverview(todayStart: string): Promise<AdminOverview> {
    const todayAiTasks = [...this.aiTasks.values()].filter((task) => task.createdAt >= todayStart);
    const todayOrders = [...this.orders.values()].filter((order) => order.createdAt >= todayStart);
    const todayRiskFiles = [...this.uploadedFiles.values()].filter((file) => file.createdAt >= todayStart && file.scanStatus !== "PASSED");
    const todayTokens = todayAiTasks.reduce((total, task) => {
      const result = this.aiTaskResults.get(task.id);
      return total + (result?.tokenUsage.totalTokens ?? 0);
    }, 0);
    const creditAccounts = [...this.creditAccounts.values()];

    return {
      totals: {
        users: this.users.size,
        creditBalance: creditAccounts.reduce((total, account) => total + account.balance, 0),
        creditEarned: creditAccounts.reduce((total, account) => total + account.totalEarned, 0),
        creditSpent: creditAccounts.reduce((total, account) => total + account.totalSpent, 0),
        todayAiTasks: todayAiTasks.length,
        todayAiTokens: todayTokens,
        todayOrders: todayOrders.length,
        todayRiskFiles: todayRiskFiles.length
      },
      recentFailedAiTasks: [...this.aiTasks.values()]
        .filter((task) => task.status === "FAILED")
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
        .slice(0, 5)
        .map((task) => toAdminAiTaskItem(task, this.users, this.aiTaskResults)),
      recentRiskFiles: [...this.uploadedFiles.values()]
        .filter((file) => file.scanStatus !== "PASSED")
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
        .slice(0, 5)
        .map((file) => toAdminUploadedFileItem(file, this.users))
    };
  }

  async listAdminUsers(pagination: { page: number; pageSize: number }, filters: { phone?: string }): Promise<AdminUserPage> {
    const items = [...this.users.values()]
      .filter((user) => (filters.phone ? user.phone.includes(filters.phone) : true))
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
    const start = (pagination.page - 1) * pagination.pageSize;

    return {
      items: items.slice(start, start + pagination.pageSize).map((user) => toAdminUserItem(user, this.creditAccounts, this.creditLedger)),
      total: items.length
    };
  }

  async listAdminOrders(pagination: { page: number; pageSize: number }, filters: { status?: RechargeOrder["status"] }): Promise<AdminOrderPage> {
    const items = [...this.orders.values()]
      .filter((order) => (filters.status ? order.status === filters.status : true))
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
    const start = (pagination.page - 1) * pagination.pageSize;

    return {
      items: items.slice(start, start + pagination.pageSize).map((order) => toAdminOrderItem(order, this.users, this.rechargePlans, this.paymentTransactions)),
      total: items.length
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
