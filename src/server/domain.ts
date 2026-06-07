export type UserStatus = "active" | "disabled";

export type User = {
  id: string;
  phone: string;
  displayName: string;
  inviteCode: string;
  referredBy: string | null;
  status: UserStatus;
  createdAt: string;
  lastLoginAt: string;
};

export type SmsScene = "login";

export type SmsCodeRecord = {
  id: string;
  phone: string;
  scene: SmsScene;
  codeHash: string | null;
  mockCode: string | null;
  expiresAt: string;
  usedAt: string | null;
  requestIp: string | null;
  createdAt: string;
};

export type CreditAccount = {
  userId: string;
  balance: number;
  totalEarned: number;
  totalSpent: number;
  version: number;
  updatedAt: string;
};

export type CreditLedgerDirection = "in" | "out";
export type CreditLedgerStatus = "posted" | "voided";
export type CreditLedgerType = "bonus" | "recharge" | "consume" | "refund";

export type CreditLedger = {
  id: string;
  userId: string;
  requestId: string;
  scene: string;
  type: CreditLedgerType;
  direction: CreditLedgerDirection;
  amount: number;
  balanceAfter: number;
  status: CreditLedgerStatus;
  sourceType: string;
  sourceId: string;
  idempotencyKey: string;
  remark: string;
  createdAt: string;
};

export type Pagination = {
  page: number;
  pageSize: number;
};

export type PayChannel = "wechat" | "alipay" | "mock";
export type PaymentProvider = "wechat" | "alipay" | "mock";
export type OrderStatus = "PENDING" | "PAID" | "CLOSED" | "FAILED";
export type PaymentTransactionStatus = "NOTIFIED" | "VERIFIED" | "DUPLICATE" | "FAILED";

export type RechargePlan = {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  points: number;
  bonusPoints: number;
  totalPoints: number;
  enabled: boolean;
  sort: number;
  createdAt: string;
  updatedAt: string;
};

export type RechargeOrder = {
  id: string;
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

export type PaymentTransaction = {
  id: string;
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

export type AiTaskType = "strategy_generation" | "code_conversion" | "code_analysis";
export type AiTaskStatus = "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELLED";
export type AiTaskScopeStatus = "in_scope" | "out_of_scope";
export type CreditReservationStatus = "RESERVED" | "CONFIRMED" | "RELEASED";
export type UploadedFileParseStatus = "PENDING" | "SUCCEEDED" | "FAILED";
export type UploadedFileScanStatus = "PASSED" | "BLOCKED" | "WARNING";

export type UploadedFile = {
  id: string;
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

export type AiTask = {
  id: string;
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

export type AiTaskResult = {
  taskId: string;
  resultType: AiTaskType;
  scopeStatus: AiTaskScopeStatus;
  generatedCode: string | null;
  explanation: string | null;
  migrationNotes: string | null;
  riskWarnings: string[];
  reportJson: Record<string, unknown> | null;
  model: string;
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  createdAt: string;
};

export type CreditReservation = {
  id: string;
  userId: string;
  taskId: string;
  amount: number;
  status: CreditReservationStatus;
  idempotencyKey: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
};
