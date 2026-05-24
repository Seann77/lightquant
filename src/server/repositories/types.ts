import type {
  CreditAccount,
  CreditLedger,
  CreditLedgerDirection,
  CreditLedgerType,
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
  createdAt: string;
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
  findPaymentTransactionByIdempotencyKey(idempotencyKey: string): Promise<PaymentTransaction | null>;
  createPaymentTransaction(input: CreatePaymentTransactionInput): Promise<PaymentTransaction>;
}
