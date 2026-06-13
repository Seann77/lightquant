import type {
  AiTask,
  AiConversation,
  AiConversationMode,
  AiConversationStatus,
  AiMessage,
  AiMessageAttachment,
  AiMessageAttachmentRole,
  AiMessageAttachmentSummary,
  AiMessageRole,
  AiRunEvent,
  AiRunEventStatus,
  AiRunEventVisibility,
  AiTaskResult,
  AiTaskStatus,
  AiTaskType,
  AiTaskScopeStatus,
  CreditAccount,
  CreditLedger,
  CreditLedgerDirection,
  CreditLedgerType,
  CreditReservation,
  CreditReservationStatus,
  OrderStatus,
  Pagination,
  PayChannel,
  PaymentProvider,
  PaymentTransaction,
  PaymentTransactionStatus,
  RechargeOrder,
  RechargePlan,
  SmsCodeRecord,
  SmsScene,
  UploadedFile,
  UploadedFileKind,
  UploadedFileParseStatus,
  UploadedFileScanStatus,
  User,
  UserLegalConsent
} from "@/server/domain";

export type PaymentActionType = "mock" | "redirect" | "qr_code";

export type AiCursor = {
  id: string;
  createdAt: string;
};

export type AiConversationPagination =
  | {
      mode: "page";
      page: number;
      pageSize: number;
    }
  | {
      mode: "cursor";
      cursor?: AiCursor;
      limit: number;
    };

export type AiMessageListOptions = {
  limit?: number;
  ascending?: boolean;
  cursor?: AiCursor;
  direction?: "before" | "after";
};

export type AiRunEventListOptions = {
  afterSeq?: number;
  limit?: number;
};

export type CreateSmsCodeInput = {
  phone: string;
  scene: SmsScene;
  codeHash: string | null;
  mockCode: string | null;
  expiresAt: string;
  requestIp: string | null;
  createdAt: string;
};

export type CreateUserInput = {
  phone: string;
  displayName: string;
  inviteCode: string;
  referredBy: string | null;
  createdAt: string;
  lastLoginAt: string;
};

export type CreateUserLegalConsentInput = {
  userId: string;
  agreementVersion: string;
  privacyVersion: string;
  agreedAt: string;
  requestIp: string | null;
  userAgent: string | null;
  source: string;
};

export type ApplyCreditLedgerInput = {
  userId: string;
  requestId: string;
  scene: string;
  type: CreditLedgerType;
  direction: CreditLedgerDirection;
  amount: number;
  sourceType: string;
  sourceId: string;
  idempotencyKey: string;
  remark: string;
  createdAt: string;
};

export type CreateRechargeOrderInput = {
  orderNo: string;
  userId: string;
  planId: string;
  amountCents: number;
  points: number;
  bonusPoints: number;
  totalPoints: number;
  payChannel: PayChannel;
  status: OrderStatus;
  clientRequestId: string;
  paidAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreatePaymentTransactionInput = {
  orderId: string;
  provider: PaymentProvider;
  providerTradeNo: string;
  notifyId: string;
  amountCents: number;
  status: PaymentTransactionStatus;
  rawPayload: Record<string, unknown>;
  idempotencyKey: string;
  verifiedAt: string | null;
  failedReason: string | null;
  orderStatusBefore: OrderStatus | null;
  orderStatusAfter: OrderStatus | null;
  createdAt: string;
};

export type CreateAiTaskInput = {
  userId: string;
  conversationId: string | null;
  type: AiTaskType;
  status: AiTaskStatus;
  scopeStatus: AiTaskScopeStatus;
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
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UpdateAiTaskInput = {
  status: AiTaskStatus;
  scopeStatus?: AiTaskScopeStatus;
  errorCode?: string | null;
  errorMessage?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  updatedAt: string;
};

export type CreateAiTaskResultInput = AiTaskResult;

export type CreateAiConversationInput = {
  userId: string;
  mode: AiConversationMode;
  title: string;
  targetPlatform: string | null;
  sourcePlatform: string | null;
  status: AiConversationStatus;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
};

export type UpdateAiConversationInput = {
  title?: string;
  targetPlatform?: string | null;
  sourcePlatform?: string | null;
  status?: AiConversationStatus;
  lastMessageAt?: string;
  updatedAt: string;
};

export type CreateAiMessageInput = {
  conversationId: string;
  userId: string;
  role: AiMessageRole;
  taskId: string | null;
  content: string;
  contentJson: Record<string, unknown> | null;
  createdAt: string;
};

export type CreateAiMessageAttachmentInput = {
  messageId: string;
  conversationId: string;
  userId: string;
  fileId: string;
  role: AiMessageAttachmentRole;
  displayOrder: number;
  caption: string | null;
  createdAt: string;
};

export type CreateAiRunEventInput = {
  taskId: string;
  conversationId: string | null;
  userId: string;
  seq: number;
  type: string;
  status: AiRunEventStatus;
  title: string;
  summary: string | null;
  detailJson: Record<string, unknown> | null;
  progressPercent: number | null;
  visibility: AiRunEventVisibility;
  createdAt: string;
};

export type CreateUploadedFileInput = {
  userId: string;
  originalName: string;
  kind?: UploadedFileKind | null;
  ext: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  storageKey?: string | null;
  thumbnailKey?: string | null;
  contentText: string | null;
  contentJson?: Record<string, unknown> | null;
  parseStatus: UploadedFileParseStatus;
  scanStatus: UploadedFileScanStatus;
  riskFlags: string[];
  createdAt: string;
  updatedAt?: string | null;
};

export type CreateCreditReservationInput = {
  userId: string;
  taskId: string;
  amount: number;
  status: CreditReservationStatus;
  idempotencyKey: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
};

export type LedgerPage = {
  items: CreditLedger[];
  total: number;
};

export type AppliedCreditLedger = {
  account: CreditAccount;
  ledger: CreditLedger;
  duplicated: boolean;
};

export type AiTaskPage = {
  items: AiTask[];
  total: number;
};

export type AiConversationPage = {
  items: AiConversation[];
  total?: number;
  nextCursor?: string | null;
};

export type AdminOverview = {
  totals: {
    users: number;
    creditBalance: number;
    creditEarned: number;
    creditSpent: number;
    todayAiTasks: number;
    todayAiTokens: number;
    todayOrders: number;
    todayRiskFiles: number;
  };
  recentFailedAiTasks: AdminAiTaskItem[];
  recentRiskFiles: AdminUploadedFileItem[];
};

export type AdminUserItem = {
  id: string;
  phone: string;
  displayName: string;
  status: User["status"];
  createdAt: string;
  lastLoginAt: string;
  creditBalance: number;
  totalEarned: number;
  totalSpent: number;
  latestLedger: {
    amount: number;
    direction: CreditLedgerDirection;
    remark: string;
    createdAt: string;
  } | null;
};

export type AdminOrderItem = {
  id: string;
  orderNo: string;
  userPhone: string;
  planName: string;
  amountCents: number;
  points: number;
  bonusPoints: number;
  totalPoints: number;
  payChannel: PayChannel;
  paymentActionType: PaymentActionType;
  status: OrderStatus;
  clientRequestId: string;
  createdAt: string;
  paidAt: string | null;
  closedAt: string | null;
  expiresAt: string;
  expired: boolean;
  latestPaymentStatus: PaymentTransactionStatus | null;
  latestPaymentProviderTradeNo: string | null;
  latestPaymentFailedReason: string | null;
};

export type AdminAiTaskItem = {
  id: string;
  userPhone: string;
  type: AiTaskType;
  status: AiTaskStatus;
  scopeStatus: AiTaskScopeStatus;
  costPoints: number;
  model: string | null;
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  } | null;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: string;
  finishedAt: string | null;
};

export type AdminUploadedFileItem = {
  id: string;
  userPhone: string;
  originalName: string;
  ext: string;
  sizeBytes: number;
  sha256Prefix: string;
  scanStatus: UploadedFileScanStatus;
  riskFlags: string[];
  createdAt: string;
};

export type AdminUserPage = {
  items: AdminUserItem[];
  total: number;
};

export type AdminOrderPage = {
  items: AdminOrderItem[];
  total: number;
};

export type AdminAiTaskPage = {
  items: AdminAiTaskItem[];
  total: number;
};

export type AdminUploadedFilePage = {
  items: AdminUploadedFileItem[];
  total: number;
};

export interface LightQuantRepository {
  createSmsCode(input: CreateSmsCodeInput): Promise<SmsCodeRecord>;
  findSmsCodeForVerification(phone: string, scene: SmsScene, code: string, now: string): Promise<SmsCodeRecord | null>;
  findLatestSmsCodeForVerification(phone: string, scene: SmsScene, now: string): Promise<SmsCodeRecord | null>;
  markSmsCodeUsed(id: string, usedAt: string): Promise<void>;
  findUserById(id: string): Promise<User | null>;
  findUserByPhone(phone: string): Promise<User | null>;
  findUserByInviteCode(inviteCode: string): Promise<User | null>;
  createUser(input: CreateUserInput): Promise<User>;
  createUserLegalConsent(input: CreateUserLegalConsentInput): Promise<UserLegalConsent>;
  updateUserLastLogin(userId: string, lastLoginAt: string): Promise<User>;
  getCreditAccount(userId: string): Promise<CreditAccount | null>;
  ensureCreditAccount(userId: string, now: string): Promise<CreditAccount>;
  applyCreditLedger(input: ApplyCreditLedgerInput): Promise<AppliedCreditLedger>;
  listCreditLedger(userId: string, pagination: Pagination): Promise<LedgerPage>;
  listEnabledRechargePlans(): Promise<RechargePlan[]>;
  findRechargePlanById(id: string): Promise<RechargePlan | null>;
  findOrderById(id: string): Promise<RechargeOrder | null>;
  findOrderByOrderNo(orderNo: string): Promise<RechargeOrder | null>;
  findRechargeOrderByClientRequestId(userId: string, clientRequestId: string): Promise<RechargeOrder | null>;
  createRechargeOrder(input: CreateRechargeOrderInput): Promise<RechargeOrder>;
  markOrderPaid(orderId: string, paidAt: string): Promise<RechargeOrder>;
  markOrderFailed(orderId: string, failedAt: string): Promise<RechargeOrder>;
  closeExpiredRechargeOrders(cutoff: string, closedAt: string): Promise<{ count: number }>;
  findPaymentTransactionByIdempotencyKey(idempotencyKey: string): Promise<PaymentTransaction | null>;
  findLatestPaymentTransactionByOrderId(orderId: string): Promise<PaymentTransaction | null>;
  createPaymentTransaction(input: CreatePaymentTransactionInput): Promise<PaymentTransaction>;
  findAiTaskById(id: string): Promise<AiTask | null>;
  findAiTaskByClientRequestId(userId: string, clientRequestId: string): Promise<AiTask | null>;
  createAiTask(input: CreateAiTaskInput): Promise<AiTask>;
  updateAiTask(taskId: string, input: UpdateAiTaskInput): Promise<AiTask>;
  createAiTaskResult(input: CreateAiTaskResultInput): Promise<AiTaskResult>;
  findAiTaskResult(taskId: string): Promise<AiTaskResult | null>;
  listAiTasks(userId: string, pagination: Pagination, filters: { type?: AiTaskType; status?: AiTaskStatus }): Promise<AiTaskPage>;
  listAiTasksForConversation(conversationId: string, options?: { limit?: number; ascending?: boolean }): Promise<AiTask[]>;
  findAiConversationById(id: string): Promise<AiConversation | null>;
  createAiConversation(input: CreateAiConversationInput): Promise<AiConversation>;
  updateAiConversation(conversationId: string, input: UpdateAiConversationInput): Promise<AiConversation>;
  listAiConversations(userId: string, pagination: AiConversationPagination, filters: { mode?: AiConversationMode; status?: AiConversationStatus }): Promise<AiConversationPage>;
  createAiMessage(input: CreateAiMessageInput): Promise<AiMessage>;
  findAiMessageByTaskId(taskId: string): Promise<AiMessage | null>;
  listAiMessages(conversationId: string, options?: AiMessageListOptions): Promise<AiMessage[]>;
  createAiMessageAttachment(input: CreateAiMessageAttachmentInput): Promise<AiMessageAttachment>;
  listAiMessageAttachmentsForMessages(userId: string, messageIds: string[]): Promise<AiMessageAttachmentSummary[]>;
  createAiRunEvent(input: CreateAiRunEventInput): Promise<AiRunEvent>;
  listAiRunEvents(taskId: string, options?: AiRunEventListOptions): Promise<AiRunEvent[]>;
  findLatestAiRunEvent(taskId: string): Promise<AiRunEvent | null>;
  getNextRunEventSeq(taskId: string): Promise<number>;
  createUploadedFile(input: CreateUploadedFileInput): Promise<UploadedFile>;
  findUploadedFileById(id: string): Promise<UploadedFile | null>;
  getAdminOverview(todayStart: string): Promise<AdminOverview>;
  listAdminUsers(pagination: Pagination, filters: { phone?: string }): Promise<AdminUserPage>;
  listAdminOrders(pagination: Pagination, filters: { status?: OrderStatus }): Promise<AdminOrderPage>;
  listAdminAiTasks(pagination: Pagination, filters: { type?: AiTaskType; status?: AiTaskStatus }): Promise<AdminAiTaskPage>;
  listAdminUploadedFiles(pagination: Pagination, filters: { scanStatus?: UploadedFileScanStatus }): Promise<AdminUploadedFilePage>;
  findCreditReservationByIdempotencyKey(idempotencyKey: string): Promise<CreditReservation | null>;
  findCreditReservationByTaskId(taskId: string): Promise<CreditReservation | null>;
  createCreditReservation(input: CreateCreditReservationInput): Promise<CreditReservation>;
  updateCreditReservationStatus(id: string, status: CreditReservationStatus, updatedAt: string): Promise<CreditReservation>;
  getActiveReservedAmount(userId: string): Promise<number>;
}
