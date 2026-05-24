import type {
  AiTask,
  AiTaskResult,
  AiTaskStatus,
  AiTaskType,
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

export type CreateAiTaskInput = {
  userId: string;
  type: AiTaskType;
  status: AiTaskStatus;
  sourcePlatform: string | null;
  targetPlatform: string | null;
  prompt: string | null;
  inputCode: string | null;
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
  errorCode?: string | null;
  errorMessage?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  updatedAt: string;
};

export type CreateAiTaskResultInput = AiTaskResult;

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
  findAiTaskById(id: string): Promise<AiTask | null>;
  findAiTaskByClientRequestId(userId: string, clientRequestId: string): Promise<AiTask | null>;
  createAiTask(input: CreateAiTaskInput): Promise<AiTask>;
  updateAiTask(taskId: string, input: UpdateAiTaskInput): Promise<AiTask>;
  createAiTaskResult(input: CreateAiTaskResultInput): Promise<AiTaskResult>;
  findAiTaskResult(taskId: string): Promise<AiTaskResult | null>;
  listAiTasks(userId: string, pagination: Pagination, filters: { type?: AiTaskType; status?: AiTaskStatus }): Promise<AiTaskPage>;
  findCreditReservationByIdempotencyKey(idempotencyKey: string): Promise<CreditReservation | null>;
  findCreditReservationByTaskId(taskId: string): Promise<CreditReservation | null>;
  createCreditReservation(input: CreateCreditReservationInput): Promise<CreditReservation>;
  updateCreditReservationStatus(id: string, status: CreditReservationStatus, updatedAt: string): Promise<CreditReservation>;
  getActiveReservedAmount(userId: string): Promise<number>;
}
