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

export type UserLegalConsent = {
  id: string;
  userId: string;
  agreementVersion: string;
  privacyVersion: string;
  agreedAt: string;
  requestIp: string | null;
  userAgent: string | null;
  source: string;
};

export type ContactMethod = "邮箱" | "微信号" | "手机号";
export type ContactCategory = "使用问题" | "策略生成" | "代码转换" | "积分/充值" | "其他";

export type ContactRequest = {
  id: string;
  userId: string | null;
  userPhone: string | null;
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

export type AiModelProvider = "mock" | "deepseek" | "openai_compatible";

export type AiModelProfile = {
  id: string;
  name: string;
  provider: AiModelProvider;
  baseUrl: string;
  model: string;
  supportsVision: boolean;
  apiKeyEnvName: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MembershipType = "beta_vip";
export type MembershipStatus = "active";

export type UserMembership = {
  id: string;
  userId: string;
  type: MembershipType;
  status: MembershipStatus;
  startsAt: string;
  endsAt: string;
  sourceType: string;
  sourceId: string;
  createdAt: string;
  updatedAt: string;
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
  failedAttempts: number;
  lastFailedAt: string | null;
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
export type AiConversationMode = "strategy" | "convert" | "analysis";
export type AiConversationStatus = "active" | "archived";
export type AiMessageRole = "user" | "assistant" | "system";
export type AiMessageAttachmentRole = "input" | "reference" | "generated";
export type AiRunEventStatus = "pending" | "running" | "completed" | "failed" | "skipped";
export type AiRunEventVisibility = "public" | "debug" | "admin_only";
export type CreditReservationStatus = "RESERVED" | "CONFIRMED" | "RELEASED";
export type UploadedFileParseStatus = "PENDING" | "SUCCEEDED" | "FAILED";
export type UploadedFileScanStatus = "PASSED" | "BLOCKED" | "WARNING";
export type UploadedFileKind = "code" | "text" | "log" | "markdown" | "image";

export type UploadedFile = {
  id: string;
  userId: string;
  originalName: string;
  kind: UploadedFileKind | null;
  ext: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  storageKey: string | null;
  thumbnailKey: string | null;
  contentText: string | null;
  contentJson: Record<string, unknown> | null;
  parseStatus: UploadedFileParseStatus;
  scanStatus: UploadedFileScanStatus;
  riskFlags: string[];
  createdAt: string;
  updatedAt: string | null;
};

export type AiTask = {
  id: string;
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

export type AiConversation = {
  id: string;
  userId: string;
  mode: AiConversationMode;
  title: string;
  targetPlatform: string | null;
  sourcePlatform: string | null;
  status: AiConversationStatus;
  uiState: Record<string, unknown> | null;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
};

export type AiMessage = {
  id: string;
  conversationId: string;
  userId: string;
  role: AiMessageRole;
  taskId: string | null;
  content: string;
  contentJson: Record<string, unknown> | null;
  createdAt: string;
};

export type AiMessageAttachment = {
  id: string;
  messageId: string;
  conversationId: string;
  userId: string;
  fileId: string;
  role: AiMessageAttachmentRole;
  displayOrder: number;
  caption: string | null;
  createdAt: string;
};

export type AiMessageAttachmentSummary = AiMessageAttachment & {
  file: {
    fileId: string;
    kind: UploadedFileKind | null;
    originalName: string;
    ext: string;
    mimeType: string;
    sizeBytes: number;
    scanStatus: UploadedFileScanStatus;
    riskFlags: string[];
    contentPreview: string;
    hasThumbnail: boolean;
    createdAt: string;
  };
};

export type AiRunEvent = {
  id: string;
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
