import { randomUUID } from "crypto";
import type { CreditAccount, CreditLedger, PaymentTransaction, RechargeOrder, RechargePlan, SmsCodeRecord, User } from "@/server/domain";
import type {
  AppliedCreditLedger,
  ApplyCreditLedgerInput,
  CreatePaymentTransactionInput,
  CreateRechargeOrderInput,
  CreateSmsCodeInput,
  CreateUserInput,
  LedgerPage,
  LightQuantRepository
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

    const updated: RechargeOrder = {
      ...order,
      status: "PAID",
      paidAt,
      updatedAt: paidAt
    };

    this.orders.set(orderId, updated);
    return updated;
  }

  async findPaymentTransactionByIdempotencyKey(idempotencyKey: string) {
    const transactionId = this.paymentTransactionsByIdempotencyKey.get(idempotencyKey);
    return transactionId ? this.paymentTransactions.get(transactionId) ?? null : null;
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
}

function clientRequestKey(userId: string, clientRequestId: string) {
  return `${userId}:${clientRequestId}`;
}
