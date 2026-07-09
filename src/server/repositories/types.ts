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
  AiModelSecret,
  AiTaskResult,
  AiTaskStatus,
  AiTaskType,
  AiTaskScopeStatus,
  AiModelProfile,
  ContactCategory,
  ContactMethod,
  ContactRequest,
  CreditAccount,
  CreditGrant,
  CreditGrantType,
  CreditLedger,
  CreditLedgerDirection,
  CreditLedgerType,
  CreditReservation,
  CreditReservationStatus,
  MembershipType,
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
  UserLegalConsent,
  UserMembership,
  WechatGroupQrCode
} from "@/server/domain";

export type PaymentActionType = "mock" | "redirect" | "qr_code";

export type ActiveMonthlyCard = {
  planId: string;
  planName: string;
  expiresAt: string;
};

export type CreditGrantSummary = {
  monthlyBalance: number;
  permanentBalance: number;
  monthlyPlanId: string | null;
  monthlyPlanName: string | null;
  monthlyExpiresAt: string | null;
};

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

export type SmsCodeFailureUpdateInput = {
  id: string;
  failedAt: string;
  resetBefore: string;
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

export type CreateContactRequestInput = {
  userId: string;
  userPhone: string;
  name: string;
  contactMethod: ContactMethod;
  contactValue: string;
  category: ContactCategory;
  message: string;
  source: string;
  requestIp: string | null;
  userAgent: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SetActiveAiModelProfileInput = {
  profileId: string;
  updatedAt: string;
};

export type CreateAiModelProfileInput = {
  name: string;
  provider: AiModelProfile["provider"];
  baseUrl: string;
  model: string;
  supportsVision: boolean;
  apiKeyEnvName: string | null;
  apiKeySecretId: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UpdateAiModelProfileInput = {
  profileId: string;
  name: string;
  provider: AiModelProfile["provider"];
  baseUrl: string;
  model: string;
  supportsVision: boolean;
  apiKeyEnvName: string | null;
  apiKeySecretId: string | null;
  enabled: boolean;
  updatedAt: string;
};

export type UpdateAiModelProfileEnabledInput = {
  profileId: string;
  enabled: boolean;
  updatedAt: string;
};

export type UpsertAiModelSecretInput = {
  secretId?: string;
  name: string;
  provider: AiModelProfile["provider"] | null;
  encryptedValue: string;
  keyHint: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UpsertUserMembershipInput = {
  userId: string;
  type: UserMembership["type"];
  status: UserMembership["status"];
  startsAt: string;
  endsAt: string;
  sourceType: string;
  sourceId: string;
  createdAt: string;
  updatedAt: string;
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
  grantType?: CreditGrantType;
  grantExpiresAt?: string | null;
};

export type CreateAdminAuditLogInput = {
  adminUserId: string;
  adminPhone: string;
  action: string;
  targetType: string;
  targetId: string;
  summary: string;
  metadata: Record<string, unknown>;
  requestId: string;
  requestIp: string | null;
  createdAt: string;
};

export type CreateAndActivateWechatGroupQrCodeInput = {
  id: string;
  storageKey: string;
  imageMimeType: string;
  imageSizeBytes: number;
  imageSha256: string;
  expiresAt: string;
  uploadedByAdminUserId: string;
  uploadedByAdminPhone: string;
  createdAt: string;
  activatedAt: string;
};

export type ApplyAdminCreditAdjustmentInput = {
  ledger: ApplyCreditLedgerInput;
  audit: CreateAdminAuditLogInput;
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
  uiState?: Record<string, unknown> | null;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
};

export type UpdateAiConversationInput = {
  title?: string;
  targetPlatform?: string | null;
  sourcePlatform?: string | null;
  status?: AiConversationStatus;
  uiState?: Record<string, unknown> | null;
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

export type CreditLedgerCategoryFilter = "all" | "income" | "consume" | "refund";

export type CreditLedgerFilters = {
  category?: CreditLedgerCategoryFilter;
  createdFrom?: string;
  createdToExclusive?: string;
};

export type AppliedCreditLedger = {
  account: CreditAccount;
  ledger: CreditLedger;
  ledgers?: CreditLedger[];
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

export type AiConversationLatestTask = Pick<AiTask, "conversationId" | "type" | "status">;

export type AdminOverview = {
  totals: {
    users: number;
    paidUsers: number;
    paidConversionRate: number;
    creditBalance: number;
    creditEarned: number;
    creditSpent: number;
    todayAiTasks: number;
    todayAiTokens: number;
    todayPaidOrders: number;
    todayPaidOrderAmountCents: number;
    paidOrders: number;
    paidOrderAmountCents: number;
  };
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

export type AdminCreditLedgerItem = {
  id: string;
  userPhone: string;
  direction: CreditLedgerDirection;
  type: CreditLedgerType;
  amount: number;
  balanceAfter: number;
  sourceType: string;
  sourceId: string;
  remark: string;
  createdAt: string;
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

export type AdminContactRequestItem = {
  id: string;
  userPhone: string | null;
  name: string;
  contactMethod: ContactMethod;
  contactValue: string;
  category: ContactCategory;
  message: string;
  source: string;
  createdAt: string;
};

export type AdminUserPage = {
  items: AdminUserItem[];
  total: number;
};

export type AdminOrderPage = {
  items: AdminOrderItem[];
  total: number;
  summary: AdminOrderSummary;
};

export type AdminOrderSummary = {
  filteredOrders: number;
  filteredOrderAmountCents: number;
  filteredPaidOrders: number;
  filteredPaidOrderAmountCents: number;
};

export type AdminAiTaskPage = {
  items: AdminAiTaskItem[];
  total: number;
};

export type AdminUploadedFilePage = {
  items: AdminUploadedFileItem[];
  total: number;
};

export type AdminCreditLedgerPage = {
  items: AdminCreditLedgerItem[];
  total: number;
};

export type AdminContactRequestPage = {
  items: AdminContactRequestItem[];
  total: number;
};

export type AdminUserFilters = {
  phone?: string;
  createdFrom?: string;
  createdTo?: string;
};

export type AdminOrderFilters = {
  phone?: string;
  status?: OrderStatus;
  createdFrom?: string;
  createdTo?: string;
};

export type AdminCreditLedgerFilters = {
  phone?: string;
  type?: CreditLedgerType;
  direction?: CreditLedgerDirection;
  createdFrom?: string;
  createdTo?: string;
};

export type AdminContactRequestFilters = {
  keyword?: string;
  contactMethod?: ContactMethod;
  category?: ContactCategory;
  source?: string;
  createdFrom?: string;
  createdTo?: string;
};

export interface LightQuantRepository {
  createSmsCode(input: CreateSmsCodeInput): Promise<SmsCodeRecord>;
  countSmsCodesByPhoneSceneSince(phone: string, scene: SmsScene, since: string): Promise<number>;
  countSmsCodesByRequestIpSince(requestIp: string, since: string): Promise<number>;
  findSmsCodeForVerification(phone: string, scene: SmsScene, code: string, now: string): Promise<SmsCodeRecord | null>;
  findLatestSmsCodeForVerification(phone: string, scene: SmsScene, now: string): Promise<SmsCodeRecord | null>;
  markSmsCodeVerificationFailed(input: SmsCodeFailureUpdateInput): Promise<SmsCodeRecord | null>;
  markSmsCodeUsed(id: string, usedAt: string): Promise<void>;
  findUserById(id: string): Promise<User | null>;
  findUserByPhone(phone: string): Promise<User | null>;
  findUserByInviteCode(inviteCode: string): Promise<User | null>;
  createUser(input: CreateUserInput): Promise<User>;
  createUserLegalConsent(input: CreateUserLegalConsentInput): Promise<UserLegalConsent>;
  createContactRequest(input: CreateContactRequestInput): Promise<ContactRequest>;
  countContactRequestsByUserSince(userId: string, since: string): Promise<number>;
  countContactRequestsByRequestIpSince(requestIp: string, since: string): Promise<number>;
  getActiveWechatGroupQrCode(): Promise<WechatGroupQrCode | null>;
  findWechatGroupQrCodeById(id: string): Promise<WechatGroupQrCode | null>;
  listAdminWechatGroupQrCodes(limit: number): Promise<WechatGroupQrCode[]>;
  createAndActivateWechatGroupQrCode(input: CreateAndActivateWechatGroupQrCodeInput): Promise<WechatGroupQrCode>;
  updateUserLastLogin(userId: string, lastLoginAt: string): Promise<User>;
  listAiModelProfiles(): Promise<AiModelProfile[]>;
  findAiModelProfileById(profileId: string): Promise<AiModelProfile | null>;
  createAiModelProfile(input: CreateAiModelProfileInput): Promise<AiModelProfile>;
  updateAiModelProfile(input: UpdateAiModelProfileInput): Promise<AiModelProfile>;
  updateAiModelProfileEnabled(input: UpdateAiModelProfileEnabledInput): Promise<AiModelProfile>;
  getActiveAiModelProfile(): Promise<AiModelProfile | null>;
  setActiveAiModelProfile(input: SetActiveAiModelProfileInput): Promise<AiModelProfile>;
  listAiModelSecrets(): Promise<AiModelSecret[]>;
  findAiModelSecretById(secretId: string): Promise<AiModelSecret | null>;
  upsertAiModelSecret(input: UpsertAiModelSecretInput): Promise<AiModelSecret>;
  findActiveMembershipForUser(userId: string, type: MembershipType, at: string): Promise<UserMembership | null>;
  upsertUserMembership(input: UpsertUserMembershipInput): Promise<UserMembership>;
  getCreditAccount(userId: string): Promise<CreditAccount | null>;
  ensureCreditAccount(userId: string, now: string): Promise<CreditAccount>;
  getCreditGrantSummary(userId: string, now: string): Promise<CreditGrantSummary>;
  getActiveMonthlyCardForUser(userId: string, now: string, exceptOrderId?: string): Promise<ActiveMonthlyCard | null>;
  expireCreditGrantsForUser(userId: string, now: string, requestId: string): Promise<void>;
  applyCreditLedger(input: ApplyCreditLedgerInput): Promise<AppliedCreditLedger>;
  applyAdminCreditAdjustment(input: ApplyAdminCreditAdjustmentInput): Promise<AppliedCreditLedger>;
  createAdminAuditLog(input: CreateAdminAuditLogInput): Promise<void>;
  listCreditLedger(userId: string, pagination: Pagination, filters?: CreditLedgerFilters): Promise<LedgerPage>;
  listEnabledRechargePlans(): Promise<RechargePlan[]>;
  findRechargePlanById(id: string): Promise<RechargePlan | null>;
  hasPaidRechargeOrderForPlan(userId: string, planId: string, exceptOrderId?: string): Promise<boolean>;
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
  countAiTasksForUserSince(userId: string, since: string): Promise<number>;
  countActiveAiTasksForUser(userId: string): Promise<number>;
  createAiTask(input: CreateAiTaskInput): Promise<AiTask>;
  updateAiTask(taskId: string, input: UpdateAiTaskInput): Promise<AiTask>;
  createAiTaskResult(input: CreateAiTaskResultInput): Promise<AiTaskResult>;
  findAiTaskResult(taskId: string): Promise<AiTaskResult | null>;
  listAiTasks(userId: string, pagination: Pagination, filters: { type?: AiTaskType; status?: AiTaskStatus }): Promise<AiTaskPage>;
  listAiTasksForConversation(conversationId: string, options?: { limit?: number; ascending?: boolean }): Promise<AiTask[]>;
  listLatestAiTasksForConversations(conversationIds: string[]): Promise<AiConversationLatestTask[]>;
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
  listUploadedFilesByIds(fileIds: string[]): Promise<UploadedFile[]>;
  getAdminOverview(todayStart: string): Promise<AdminOverview>;
  listAdminUsers(pagination: Pagination, filters: AdminUserFilters): Promise<AdminUserPage>;
  listAdminOrders(pagination: Pagination, filters: AdminOrderFilters): Promise<AdminOrderPage>;
  listAdminAiTasks(pagination: Pagination, filters: { type?: AiTaskType; status?: AiTaskStatus }): Promise<AdminAiTaskPage>;
  listAdminUploadedFiles(pagination: Pagination, filters: { scanStatus?: UploadedFileScanStatus }): Promise<AdminUploadedFilePage>;
  listAdminCreditLedger(pagination: Pagination, filters: AdminCreditLedgerFilters): Promise<AdminCreditLedgerPage>;
  listAdminContactRequests(pagination: Pagination, filters: AdminContactRequestFilters): Promise<AdminContactRequestPage>;
  findCreditReservationByIdempotencyKey(idempotencyKey: string): Promise<CreditReservation | null>;
  findCreditReservationByTaskId(taskId: string): Promise<CreditReservation | null>;
  createCreditReservation(input: CreateCreditReservationInput): Promise<CreditReservation>;
  updateCreditReservationStatus(id: string, status: CreditReservationStatus, updatedAt: string): Promise<CreditReservation>;
  getActiveReservedAmount(userId: string): Promise<number>;
}
