import type {
  AiTask,
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
  UploadedFileParseStatus,
  UploadedFileScanStatus,
  User
} from "@/server/domain";

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

export type CreateUploadedFileInput = {
  userId: string;
  originalName: string;
  ext: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  contentText: string;
  parseStatus: UploadedFileParseStatus;
  scanStatus: UploadedFileScanStatus;
  riskFlags: string[];
  createdAt: string;
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
  markSmsCodeUsed(id: string, usedAt: string): Promise<void>;
  findUserById(id: string): Promise<User | null>;
  findUserByPhone(phone: string): Promise<User | null>;
  findUserByInviteCode(inviteCode: string): Promise<User | null>;
  createUser(input: CreateUserInput): Promise<User>;
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
