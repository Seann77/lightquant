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
  createdAt: string;
};
