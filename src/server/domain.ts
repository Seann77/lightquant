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

