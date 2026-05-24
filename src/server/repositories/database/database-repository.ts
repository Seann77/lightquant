import { randomUUID } from "crypto";
import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import type {
  AiTask,
  AiTaskResult,
  CreditAccount,
  CreditLedger,
  CreditReservation,
  PaymentTransaction,
  RechargeOrder,
  RechargePlan,
  SmsCodeRecord,
  User
} from "@/server/domain";
import { ApiError } from "@/server/http/api-response";
import { getPrismaClient } from "@/server/repositories/database/prisma-client";
import type {
  AiTaskPage,
  AppliedCreditLedger,
  ApplyCreditLedgerInput,
  CreateAiTaskInput,
  CreateAiTaskResultInput,
  CreateCreditReservationInput,
  CreatePaymentTransactionInput,
  CreateRechargeOrderInput,
  CreateSmsCodeInput,
  CreateUserInput,
  LedgerPage,
  LightQuantRepository,
  UpdateAiTaskInput
} from "@/server/repositories/types";

type PrismaDb = PrismaClient | Prisma.TransactionClient;

export class DatabaseLightQuantRepository implements LightQuantRepository {
  constructor(private readonly db: PrismaDb = getPrismaClient()) {}

  async withTransaction<T>(callback: (repository: DatabaseLightQuantRepository) => Promise<T>) {
    if (!isRootPrismaClient(this.db)) {
      return callback(this);
    }

    return this.db.$transaction(
      async (transaction) => callback(new DatabaseLightQuantRepository(transaction)),
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable
      }
    );
  }

  async createSmsCode(input: CreateSmsCodeInput) {
    const record = await this.db.smsCode.create({
      data: {
        phone: input.phone,
        scene: input.scene,
        codeHash: input.codeHash,
        mockCode: input.mockCode,
        expiresAt: toDate(input.expiresAt),
        requestIp: input.requestIp,
        createdAt: toDate(input.createdAt)
      }
    });

    return toSmsCode(record);
  }

  async findSmsCodeForVerification(phone: string, scene: SmsCodeRecord["scene"], code: string, now: string) {
    const record = await this.db.smsCode.findFirst({
      where: {
        phone,
        scene,
        usedAt: null,
        expiresAt: {
          gt: toDate(now)
        },
        OR: [
          {
            mockCode: code
          },
          {
            codeHash: code
          }
        ]
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return record ? toSmsCode(record) : null;
  }

  async markSmsCodeUsed(id: string, usedAt: string) {
    await this.db.smsCode.updateMany({
      where: {
        id,
        usedAt: null
      },
      data: {
        usedAt: toDate(usedAt)
      }
    });
  }

  async findUserById(id: string) {
    const user = await this.db.user.findUnique({
      where: {
        id
      }
    });

    return user ? toUser(user) : null;
  }

  async findUserByPhone(phone: string) {
    const user = await this.db.user.findUnique({
      where: {
        phone
      }
    });

    return user ? toUser(user) : null;
  }

  async findUserByInviteCode(inviteCode: string) {
    const user = await this.db.user.findUnique({
      where: {
        inviteCode
      }
    });

    return user ? toUser(user) : null;
  }

  async createUser(input: CreateUserInput) {
    try {
      const user = await this.db.user.create({
        data: {
          phone: input.phone,
          displayName: input.displayName,
          inviteCode: input.inviteCode,
          referredBy: input.referredBy,
          status: "active",
          createdAt: toDate(input.createdAt),
          lastLoginAt: toDate(input.lastLoginAt)
        }
      });

      return toUser(user);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ApiError("IDEMPOTENCY_CONFLICT", "用户已存在或邀请码冲突，请重试", 409);
      }

      throw error;
    }
  }

  async updateUserLastLogin(userId: string, lastLoginAt: string) {
    const user = await this.db.user.update({
      where: {
        id: userId
      },
      data: {
        lastLoginAt: toDate(lastLoginAt)
      }
    });

    return toUser(user);
  }

  async getCreditAccount(userId: string) {
    const account = await this.db.creditAccount.findUnique({
      where: {
        userId
      }
    });

    return account ? toCreditAccount(account) : null;
  }

  async ensureCreditAccount(userId: string, now: string) {
    const account = await this.db.creditAccount.upsert({
      where: {
        userId
      },
      create: {
        userId,
        balance: 0,
        totalEarned: 0,
        totalSpent: 0,
        version: 0,
        updatedAt: toDate(now)
      },
      update: {}
    });

    return toCreditAccount(account);
  }

  async applyCreditLedger(input: ApplyCreditLedgerInput): Promise<AppliedCreditLedger> {
    return this.withTransaction(async (repository) => repository.applyCreditLedgerInTransaction(input));
  }

  private async applyCreditLedgerInTransaction(input: ApplyCreditLedgerInput): Promise<AppliedCreditLedger> {
    const existing = await this.db.creditLedger.findUnique({
      where: {
        idempotencyKey: input.idempotencyKey
      }
    });

    if (existing) {
      return {
        account: await this.ensureCreditAccount(input.userId, input.createdAt),
        ledger: toCreditLedger(existing),
        duplicated: true
      };
    }

    await this.ensureCreditAccount(input.userId, input.createdAt);
    await lockCreditAccount(this.db, input.userId);

    const existingAfterLock = await this.db.creditLedger.findUnique({
      where: {
        idempotencyKey: input.idempotencyKey
      }
    });

    if (existingAfterLock) {
      return {
        account: await this.ensureCreditAccount(input.userId, input.createdAt),
        ledger: toCreditLedger(existingAfterLock),
        duplicated: true
      };
    }

    const previousAccount = await this.db.creditAccount.findUniqueOrThrow({
      where: {
        userId: input.userId
      }
    });
    const signedAmount = input.direction === "in" ? input.amount : -input.amount;
    const nextBalance = previousAccount.balance + signedAmount;

    if (nextBalance < 0) {
      throw new ApiError("INSUFFICIENT_CREDITS", "积分余额不足，请先充值", 402);
    }

    const updatedAccount = await this.db.creditAccount.update({
      where: {
        userId: input.userId
      },
      data: {
        balance: nextBalance,
        totalEarned: input.direction === "in" ? { increment: input.amount } : undefined,
        totalSpent: input.direction === "out" ? { increment: input.amount } : undefined,
        version: {
          increment: 1
        },
        updatedAt: toDate(input.createdAt)
      }
    });
    const ledger = await this.db.creditLedger.create({
      data: {
        id: randomUUID(),
        userId: input.userId,
        requestId: input.requestId,
        scene: input.scene,
        type: input.type,
        direction: input.direction,
        amount: input.amount,
        balanceAfter: updatedAccount.balance,
        status: "posted",
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        idempotencyKey: input.idempotencyKey,
        remark: input.remark,
        createdAt: toDate(input.createdAt)
      }
    });

    return {
      account: toCreditAccount(updatedAccount),
      ledger: toCreditLedger(ledger),
      duplicated: false
    };
  }

  async listCreditLedger(userId: string, pagination: { page: number; pageSize: number }): Promise<LedgerPage> {
    const [items, total] = await Promise.all([
      this.db.creditLedger.findMany({
        where: {
          userId
        },
        orderBy: {
          createdAt: "desc"
        },
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize
      }),
      this.db.creditLedger.count({
        where: {
          userId
        }
      })
    ]);

    return {
      items: items.map(toCreditLedger),
      total
    };
  }

  async listEnabledRechargePlans() {
    const plans = await this.db.rechargePlan.findMany({
      where: {
        enabled: true
      },
      orderBy: {
        sort: "asc"
      }
    });

    return plans.map(toRechargePlan);
  }

  async findRechargePlanById(id: string) {
    const plan = await this.db.rechargePlan.findUnique({
      where: {
        id
      }
    });

    return plan ? toRechargePlan(plan) : null;
  }

  async findOrderById(id: string) {
    const order = await this.db.rechargeOrder.findUnique({
      where: {
        id
      }
    });

    return order ? toRechargeOrder(order) : null;
  }

  async findOrderByOrderNo(orderNo: string) {
    const order = await this.db.rechargeOrder.findUnique({
      where: {
        orderNo
      }
    });

    return order ? toRechargeOrder(order) : null;
  }

  async findRechargeOrderByClientRequestId(userId: string, clientRequestId: string) {
    const order = await this.db.rechargeOrder.findUnique({
      where: {
        userId_clientRequestId: {
          userId,
          clientRequestId
        }
      }
    });

    return order ? toRechargeOrder(order) : null;
  }

  async createRechargeOrder(input: CreateRechargeOrderInput) {
    try {
      const order = await this.db.rechargeOrder.create({
        data: {
          orderNo: input.orderNo,
          userId: input.userId,
          planId: input.planId,
          amountCents: input.amountCents,
          points: input.points,
          bonusPoints: input.bonusPoints,
          totalPoints: input.totalPoints,
          payChannel: input.payChannel,
          status: input.status,
          clientRequestId: input.clientRequestId,
          paidAt: input.paidAt ? toDate(input.paidAt) : null,
          closedAt: input.closedAt ? toDate(input.closedAt) : null,
          createdAt: toDate(input.createdAt),
          updatedAt: toDate(input.updatedAt)
        }
      });

      return toRechargeOrder(order);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        const existing = await this.findRechargeOrderByClientRequestId(input.userId, input.clientRequestId);

        if (existing) {
          return existing;
        }
      }

      throw error;
    }
  }

  async markOrderPaid(orderId: string, paidAt: string) {
    const order = await this.db.rechargeOrder.update({
      where: {
        id: orderId
      },
      data: {
        status: "PAID",
        paidAt: toDate(paidAt),
        updatedAt: toDate(paidAt)
      }
    });

    return toRechargeOrder(order);
  }

  async findPaymentTransactionByIdempotencyKey(idempotencyKey: string) {
    const transaction = await this.db.paymentTransaction.findUnique({
      where: {
        idempotencyKey
      }
    });

    return transaction ? toPaymentTransaction(transaction) : null;
  }

  async createPaymentTransaction(input: CreatePaymentTransactionInput) {
    const existing = await this.findPaymentTransactionByIdempotencyKey(input.idempotencyKey);

    if (existing) {
      return existing;
    }

    try {
      const transaction = await this.db.paymentTransaction.create({
        data: {
          orderId: input.orderId,
          provider: input.provider,
          providerTradeNo: input.providerTradeNo,
          notifyId: input.notifyId,
          amountCents: input.amountCents,
          status: input.status,
          rawPayload: toJsonObject(input.rawPayload),
          idempotencyKey: input.idempotencyKey,
          createdAt: toDate(input.createdAt)
        }
      });

      return toPaymentTransaction(transaction);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        const transaction = await this.findPaymentTransactionByIdempotencyKey(input.idempotencyKey);

        if (transaction) {
          return transaction;
        }
      }

      throw error;
    }
  }

  async findAiTaskById(id: string) {
    const task = await this.db.aiTask.findUnique({
      where: {
        id
      }
    });

    return task ? toAiTask(task) : null;
  }

  async findAiTaskByClientRequestId(userId: string, clientRequestId: string) {
    const task = await this.db.aiTask.findUnique({
      where: {
        userId_clientRequestId: {
          userId,
          clientRequestId
        }
      }
    });

    return task ? toAiTask(task) : null;
  }

  async createAiTask(input: CreateAiTaskInput) {
    try {
      const task = await this.db.aiTask.create({
        data: {
          userId: input.userId,
          type: input.type,
          status: input.status,
          scopeStatus: input.scopeStatus,
          sourcePlatform: input.sourcePlatform,
          targetPlatform: input.targetPlatform,
          prompt: input.prompt,
          inputCode: input.inputCode,
          costPoints: input.costPoints,
          clientRequestId: input.clientRequestId,
          requestId: input.requestId,
          errorCode: input.errorCode,
          errorMessage: input.errorMessage,
          startedAt: input.startedAt ? toDate(input.startedAt) : null,
          finishedAt: input.finishedAt ? toDate(input.finishedAt) : null,
          createdAt: toDate(input.createdAt),
          updatedAt: toDate(input.updatedAt)
        }
      });

      return toAiTask(task);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        const existing = await this.findAiTaskByClientRequestId(input.userId, input.clientRequestId);

        if (existing) {
          return existing;
        }
      }

      throw error;
    }
  }

  async updateAiTask(taskId: string, input: UpdateAiTaskInput) {
    const task = await this.db.aiTask.update({
      where: {
        id: taskId
      },
      data: {
        status: input.status,
        scopeStatus: input.scopeStatus,
        errorCode: input.errorCode,
        errorMessage: input.errorMessage,
        startedAt: input.startedAt === undefined ? undefined : input.startedAt ? toDate(input.startedAt) : null,
        finishedAt: input.finishedAt === undefined ? undefined : input.finishedAt ? toDate(input.finishedAt) : null,
        updatedAt: toDate(input.updatedAt)
      }
    });

    return toAiTask(task);
  }

  async createAiTaskResult(input: CreateAiTaskResultInput) {
    const result = await this.db.aiTaskResult.upsert({
      where: {
        taskId: input.taskId
      },
      create: {
        taskId: input.taskId,
        resultType: input.resultType,
        scopeStatus: input.scopeStatus,
        generatedCode: input.generatedCode,
        explanation: input.explanation,
        migrationNotes: input.migrationNotes,
        riskWarnings: input.riskWarnings,
        reportJson: input.reportJson === null ? Prisma.JsonNull : toJsonObject(input.reportJson),
        model: input.model,
        tokenUsage: toJsonObject(input.tokenUsage),
        createdAt: toDate(input.createdAt)
      },
      update: {}
    });

    return toAiTaskResult(result);
  }

  async findAiTaskResult(taskId: string) {
    const result = await this.db.aiTaskResult.findUnique({
      where: {
        taskId
      }
    });

    return result ? toAiTaskResult(result) : null;
  }

  async listAiTasks(userId: string, pagination: { page: number; pageSize: number }, filters: { type?: AiTask["type"]; status?: AiTask["status"] }): Promise<AiTaskPage> {
    const where = {
      userId,
      type: filters.type,
      status: filters.status
    };
    const [items, total] = await Promise.all([
      this.db.aiTask.findMany({
        where,
        orderBy: {
          createdAt: "desc"
        },
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize
      }),
      this.db.aiTask.count({
        where
      })
    ]);

    return {
      items: items.map(toAiTask),
      total
    };
  }

  async findCreditReservationByIdempotencyKey(idempotencyKey: string) {
    const reservation = await this.db.creditReservation.findUnique({
      where: {
        idempotencyKey
      }
    });

    return reservation ? toCreditReservation(reservation) : null;
  }

  async findCreditReservationByTaskId(taskId: string) {
    const reservation = await this.db.creditReservation.findUnique({
      where: {
        taskId
      }
    });

    return reservation ? toCreditReservation(reservation) : null;
  }

  async createCreditReservation(input: CreateCreditReservationInput) {
    return this.withTransaction(async (repository) => repository.createCreditReservationInTransaction(input));
  }

  private async createCreditReservationInTransaction(input: CreateCreditReservationInput) {
    const existing = await this.findCreditReservationByIdempotencyKey(input.idempotencyKey);

    if (existing) {
      return existing;
    }

    await this.ensureCreditAccount(input.userId, input.createdAt);
    await lockCreditAccount(this.db, input.userId);

    const account = await this.db.creditAccount.findUniqueOrThrow({
      where: {
        userId: input.userId
      }
    });
    const activeReserved = await this.getActiveReservedAmount(input.userId);

    if (account.balance - activeReserved < input.amount) {
      throw new ApiError("INSUFFICIENT_CREDITS", "积分余额不足，请先充值", 402);
    }

    try {
      const reservation = await this.db.creditReservation.create({
        data: {
          userId: input.userId,
          taskId: input.taskId,
          amount: input.amount,
          status: input.status,
          idempotencyKey: input.idempotencyKey,
          expiresAt: toDate(input.expiresAt),
          createdAt: toDate(input.createdAt),
          updatedAt: toDate(input.updatedAt)
        }
      });

      return toCreditReservation(reservation);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        const reservation = await this.findCreditReservationByIdempotencyKey(input.idempotencyKey);

        if (reservation) {
          return reservation;
        }
      }

      throw error;
    }
  }

  async updateCreditReservationStatus(id: string, status: CreditReservation["status"], updatedAt: string) {
    const reservation = await this.db.creditReservation.update({
      where: {
        id
      },
      data: {
        status,
        updatedAt: toDate(updatedAt)
      }
    });

    return toCreditReservation(reservation);
  }

  async getActiveReservedAmount(userId: string) {
    const result = await this.db.creditReservation.aggregate({
      where: {
        userId,
        status: "RESERVED"
      },
      _sum: {
        amount: true
      }
    });

    return result._sum.amount ?? 0;
  }
}

async function lockCreditAccount(db: PrismaDb, userId: string) {
  await db.$queryRaw(Prisma.sql`SELECT user_id FROM credit_accounts WHERE user_id = ${userId}::uuid FOR UPDATE`);
}

function isRootPrismaClient(db: PrismaDb): db is PrismaClient {
  return "$transaction" in db;
}

function toDate(value: string) {
  return new Date(value);
}

function toIso(value: Date) {
  return value.toISOString();
}

function toUser(user: {
  id: string;
  phone: string;
  displayName: string;
  inviteCode: string;
  referredBy: string | null;
  status: User["status"];
  createdAt: Date;
  lastLoginAt: Date;
}): User {
  return {
    id: user.id,
    phone: user.phone,
    displayName: user.displayName,
    inviteCode: user.inviteCode,
    referredBy: user.referredBy,
    status: user.status,
    createdAt: toIso(user.createdAt),
    lastLoginAt: toIso(user.lastLoginAt)
  };
}

function toSmsCode(record: {
  id: string;
  phone: string;
  scene: SmsCodeRecord["scene"];
  codeHash: string | null;
  mockCode: string | null;
  expiresAt: Date;
  usedAt: Date | null;
  requestIp: string | null;
  createdAt: Date;
}): SmsCodeRecord {
  return {
    id: record.id,
    phone: record.phone,
    scene: record.scene,
    codeHash: record.codeHash,
    mockCode: record.mockCode,
    expiresAt: toIso(record.expiresAt),
    usedAt: record.usedAt ? toIso(record.usedAt) : null,
    requestIp: record.requestIp,
    createdAt: toIso(record.createdAt)
  };
}

function toCreditAccount(account: {
  userId: string;
  balance: number;
  totalEarned: number;
  totalSpent: number;
  version: number;
  updatedAt: Date;
}): CreditAccount {
  return {
    userId: account.userId,
    balance: account.balance,
    totalEarned: account.totalEarned,
    totalSpent: account.totalSpent,
    version: account.version,
    updatedAt: toIso(account.updatedAt)
  };
}

function toCreditLedger(ledger: {
  id: string;
  userId: string;
  requestId: string;
  scene: string;
  type: CreditLedger["type"];
  direction: CreditLedger["direction"];
  amount: number;
  balanceAfter: number;
  status: CreditLedger["status"];
  sourceType: string;
  sourceId: string;
  idempotencyKey: string;
  remark: string;
  createdAt: Date;
}): CreditLedger {
  return {
    id: ledger.id,
    userId: ledger.userId,
    requestId: ledger.requestId,
    scene: ledger.scene,
    type: ledger.type,
    direction: ledger.direction,
    amount: ledger.amount,
    balanceAfter: ledger.balanceAfter,
    status: ledger.status,
    sourceType: ledger.sourceType,
    sourceId: ledger.sourceId,
    idempotencyKey: ledger.idempotencyKey,
    remark: ledger.remark,
    createdAt: toIso(ledger.createdAt)
  };
}

function toRechargePlan(plan: {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  points: number;
  bonusPoints: number;
  totalPoints: number;
  enabled: boolean;
  sort: number;
  createdAt: Date;
  updatedAt: Date;
}): RechargePlan {
  return {
    id: plan.id,
    name: plan.name,
    description: plan.description,
    priceCents: plan.priceCents,
    points: plan.points,
    bonusPoints: plan.bonusPoints,
    totalPoints: plan.totalPoints,
    enabled: plan.enabled,
    sort: plan.sort,
    createdAt: toIso(plan.createdAt),
    updatedAt: toIso(plan.updatedAt)
  };
}

function toRechargeOrder(order: {
  id: string;
  orderNo: string;
  userId: string;
  planId: string;
  amountCents: number;
  points: number;
  bonusPoints: number;
  totalPoints: number;
  payChannel: RechargeOrder["payChannel"];
  status: RechargeOrder["status"];
  clientRequestId: string;
  paidAt: Date | null;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): RechargeOrder {
  return {
    id: order.id,
    orderNo: order.orderNo,
    userId: order.userId,
    planId: order.planId,
    amountCents: order.amountCents,
    points: order.points,
    bonusPoints: order.bonusPoints,
    totalPoints: order.totalPoints,
    payChannel: order.payChannel,
    status: order.status,
    clientRequestId: order.clientRequestId,
    paidAt: order.paidAt ? toIso(order.paidAt) : null,
    closedAt: order.closedAt ? toIso(order.closedAt) : null,
    createdAt: toIso(order.createdAt),
    updatedAt: toIso(order.updatedAt)
  };
}

function toPaymentTransaction(transaction: {
  id: string;
  orderId: string;
  provider: PaymentTransaction["provider"];
  providerTradeNo: string;
  notifyId: string;
  amountCents: number;
  status: PaymentTransaction["status"];
  rawPayload: Prisma.JsonValue;
  idempotencyKey: string;
  createdAt: Date;
}): PaymentTransaction {
  return {
    id: transaction.id,
    orderId: transaction.orderId,
    provider: transaction.provider,
    providerTradeNo: transaction.providerTradeNo,
    notifyId: transaction.notifyId,
    amountCents: transaction.amountCents,
    status: transaction.status,
    rawPayload: toRecord(transaction.rawPayload),
    idempotencyKey: transaction.idempotencyKey,
    createdAt: toIso(transaction.createdAt)
  };
}

function toAiTask(task: {
  id: string;
  userId: string;
  type: AiTask["type"];
  status: AiTask["status"];
  scopeStatus: AiTask["scopeStatus"];
  sourcePlatform: string | null;
  targetPlatform: string | null;
  prompt: string | null;
  inputCode: string | null;
  costPoints: number;
  clientRequestId: string;
  requestId: string;
  errorCode: string | null;
  errorMessage: string | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): AiTask {
  return {
    id: task.id,
    userId: task.userId,
    type: task.type,
    status: task.status,
    scopeStatus: task.scopeStatus,
    sourcePlatform: task.sourcePlatform,
    targetPlatform: task.targetPlatform,
    prompt: task.prompt,
    inputCode: task.inputCode,
    costPoints: task.costPoints,
    clientRequestId: task.clientRequestId,
    requestId: task.requestId,
    errorCode: task.errorCode,
    errorMessage: task.errorMessage,
    startedAt: task.startedAt ? toIso(task.startedAt) : null,
    finishedAt: task.finishedAt ? toIso(task.finishedAt) : null,
    createdAt: toIso(task.createdAt),
    updatedAt: toIso(task.updatedAt)
  };
}

function toAiTaskResult(result: {
  taskId: string;
  resultType: AiTaskResult["resultType"];
  scopeStatus: AiTaskResult["scopeStatus"];
  generatedCode: string | null;
  explanation: string | null;
  migrationNotes: string | null;
  riskWarnings: Prisma.JsonValue;
  reportJson: Prisma.JsonValue | null;
  model: string;
  tokenUsage: Prisma.JsonValue;
  createdAt: Date;
}): AiTaskResult {
  return {
    taskId: result.taskId,
    resultType: result.resultType,
    scopeStatus: result.scopeStatus,
    generatedCode: result.generatedCode,
    explanation: result.explanation,
    migrationNotes: result.migrationNotes,
    riskWarnings: toStringArray(result.riskWarnings),
    reportJson: result.reportJson === null ? null : toRecord(result.reportJson),
    model: result.model,
    tokenUsage: toTokenUsage(result.tokenUsage),
    createdAt: toIso(result.createdAt)
  };
}

function toCreditReservation(reservation: {
  id: string;
  userId: string;
  taskId: string;
  amount: number;
  status: CreditReservation["status"];
  idempotencyKey: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}): CreditReservation {
  return {
    id: reservation.id,
    userId: reservation.userId,
    taskId: reservation.taskId,
    amount: reservation.amount,
    status: reservation.status,
    idempotencyKey: reservation.idempotencyKey,
    expiresAt: toIso(reservation.expiresAt),
    createdAt: toIso(reservation.createdAt),
    updatedAt: toIso(reservation.updatedAt)
  };
}

function toRecord(value: Prisma.JsonValue): Record<string, unknown> {
  return isObject(value) ? value : {};
}

function toJsonObject(value: Record<string, unknown>): Prisma.InputJsonObject {
  return value as Prisma.InputJsonObject;
}

function toStringArray(value: Prisma.JsonValue) {
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

function toTokenUsage(value: Prisma.JsonValue) {
  const record = toRecord(value);

  return {
    promptTokens: Number(record.promptTokens ?? 0),
    completionTokens: Number(record.completionTokens ?? 0),
    totalTokens: Number(record.totalTokens ?? 0)
  };
}

function isObject(value: Prisma.JsonValue): value is Prisma.JsonObject {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isUniqueConstraintError(error: unknown) {
  return isPrismaError(error, "P2002");
}

function isPrismaError(error: unknown, code: string) {
  return Boolean(error && typeof error === "object" && "code" in error && (error as { code?: string }).code === code);
}
