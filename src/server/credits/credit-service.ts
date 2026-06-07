import type { AiTask, CreditAccount, CreditLedger, CreditReservation, Pagination, RechargeOrder } from "@/server/domain";
import { ApiError } from "@/server/http/api-response";
import { getRepository } from "@/server/repositories";

const SIGNUP_BONUS_POINTS = 500;

export type CreditLedgerResponseItem = {
  id: string;
  createdAt: string;
  time: string;
  category: string;
  title: string;
  description: string;
  scene: string;
  type: string;
  direction: "in" | "out";
  amount: number;
  balanceAfter: number;
  status: string;
  sourceType: string;
  sourceId: string;
  remark: string;
};

export async function ensureSignupBonus(userId: string, requestId: string) {
  const now = new Date().toISOString();
  const repository = getRepository();

  return repository.applyCreditLedger({
    userId,
    requestId,
    scene: "signup_bonus",
    type: "bonus",
    direction: "in",
    amount: SIGNUP_BONUS_POINTS,
    sourceType: "auth",
    sourceId: userId,
    idempotencyKey: `signup_bonus:${userId}`,
    remark: "新用户注册赠送 500 基础积分",
    createdAt: now
  });
}

export async function applyRechargeCredit(order: RechargeOrder, requestId: string) {
  const now = new Date().toISOString();
  const repository = getRepository();

  return repository.applyCreditLedger({
    userId: order.userId,
    requestId,
    scene: "recharge",
    type: "recharge",
    direction: "in",
    amount: order.totalPoints,
    sourceType: "recharge",
    sourceId: order.id,
    idempotencyKey: `recharge:${order.id}`,
    remark: `充值到账：订单 ${order.orderNo}，获得 ${order.totalPoints.toLocaleString("zh-CN")} 积分`,
    createdAt: now
  });
}

export async function reserveCredits(input: { userId: string; taskId: string; amount: number }) {
  if (!Number.isInteger(input.amount) || input.amount <= 0) {
    throw new ApiError("VALIDATION_ERROR", "积分预占金额不正确", 400);
  }

  const repository = getRepository();
  const idempotencyKey = `ai_task_reserve:${input.taskId}`;
  const existing = await repository.findCreditReservationByIdempotencyKey(idempotencyKey);

  if (existing) {
    return {
      reservation: existing,
      duplicated: true
    };
  }

  const now = new Date().toISOString();
  const account = await repository.ensureCreditAccount(input.userId, now);
  const activeReservedAmount = await repository.getActiveReservedAmount(input.userId);

  if (account.balance - activeReservedAmount < input.amount) {
    throw new ApiError("INSUFFICIENT_CREDITS", "积分余额不足，请先充值", 402);
  }

  const reservation = await repository.createCreditReservation({
    userId: input.userId,
    taskId: input.taskId,
    amount: input.amount,
    status: "RESERVED",
    idempotencyKey,
    expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    createdAt: now,
    updatedAt: now
  });

  return {
    reservation,
    duplicated: false
  };
}

export async function confirmReservation(task: AiTask, requestId: string) {
  const repository = getRepository();
  const reservation = await repository.findCreditReservationByTaskId(task.id);

  if (!reservation) {
    throw new ApiError("NOT_FOUND", "积分预占记录不存在", 404);
  }

  const now = new Date().toISOString();
  const ledgerResult = await repository.applyCreditLedger({
    userId: task.userId,
    requestId,
    scene: "ai_task",
    type: "consume",
    direction: "out",
    amount: reservation.amount,
    sourceType: "ai_task",
    sourceId: task.id,
    idempotencyKey: `ai_task_cost:${task.id}`,
    remark: aiCostRemark(task),
    createdAt: now
  });

  if (reservation.status !== "CONFIRMED") {
    await repository.updateCreditReservationStatus(reservation.id, "CONFIRMED", now);
  }

  return {
    ...ledgerResult,
    reservation: {
      ...reservation,
      status: "CONFIRMED" as const,
      updatedAt: now
    }
  };
}

export async function releaseReservation(taskId: string) {
  const repository = getRepository();
  const reservation = await repository.findCreditReservationByTaskId(taskId);

  if (!reservation || reservation.status !== "RESERVED") {
    return {
      reservation,
      released: false
    };
  }

  const updated = await repository.updateCreditReservationStatus(reservation.id, "RELEASED", new Date().toISOString());

  return {
    reservation: updated,
    released: true
  };
}

export async function refundConfirmedAiTaskCost(task: AiTask, requestId: string) {
  const repository = getRepository();
  const reservation = await repository.findCreditReservationByTaskId(task.id);

  if (!reservation || reservation.status !== "CONFIRMED") {
    return null;
  }

  return repository.applyCreditLedger({
    userId: task.userId,
    requestId,
    scene: "ai_task_refund",
    type: "refund",
    direction: "in",
    amount: reservation.amount,
    sourceType: "ai_task",
    sourceId: task.id,
    idempotencyKey: `ai_task_refund:${task.id}`,
    remark: `${aiCostRemark(task)}失败退回`,
    createdAt: new Date().toISOString()
  });
}

export async function getCreditAccountForUser(userId: string) {
  const repository = getRepository();
  const account = await repository.ensureCreditAccount(userId, new Date().toISOString());

  return toCreditAccountResponse(account);
}

export async function listCreditLedgerForUser(userId: string, pagination: Pagination) {
  const repository = getRepository();
  const safePagination = normalizePagination(pagination);
  const page = await repository.listCreditLedger(userId, safePagination);

  return {
    items: page.items.map(toCreditLedgerResponseItem),
    page: safePagination.page,
    pageSize: safePagination.pageSize,
    total: page.total,
    totalPages: Math.max(1, Math.ceil(page.total / safePagination.pageSize))
  };
}

export function toCreditAccountResponse(account: CreditAccount) {
  return {
    userId: account.userId,
    balance: account.balance,
    totalEarned: account.totalEarned,
    totalSpent: account.totalSpent,
    version: account.version,
    updatedAt: account.updatedAt
  };
}

function normalizePagination(pagination: Pagination): Pagination {
  if (!Number.isInteger(pagination.page) || pagination.page < 1) {
    throw new ApiError("VALIDATION_ERROR", "分页页码不正确", 400);
  }

  if (!Number.isInteger(pagination.pageSize) || pagination.pageSize < 1 || pagination.pageSize > 50) {
    throw new ApiError("VALIDATION_ERROR", "分页大小不正确", 400);
  }

  return pagination;
}

function toCreditLedgerResponseItem(ledger: CreditLedger): CreditLedgerResponseItem {
  const signedAmount = ledger.direction === "in" ? ledger.amount : -ledger.amount;

  return {
    id: ledger.id,
    createdAt: ledger.createdAt,
    time: formatDateTime(ledger.createdAt),
    category: categoryForLedger(ledger),
    title: titleForLedger(ledger),
    description: ledger.remark,
    scene: ledger.scene,
    type: ledger.type,
    direction: ledger.direction,
    amount: signedAmount,
    balanceAfter: ledger.balanceAfter,
    status: statusText(ledger.status),
    sourceType: ledger.sourceType,
    sourceId: ledger.sourceId,
    remark: ledger.remark
  };
}

function categoryForLedger(ledger: CreditLedger) {
  if (ledger.direction === "in" && ledger.type === "refund") {
    return "退回";
  }

  if (ledger.direction === "in") {
    return "获取";
  }

  return "消耗";
}

function titleForLedger(ledger: CreditLedger) {
  if (ledger.scene === "signup_bonus") {
    return "新用户注册赠送";
  }

  if (ledger.scene === "recharge") {
    return "充值到账";
  }

  if (ledger.scene === "ai_task") {
    return "AI 任务消耗";
  }

  if (ledger.scene === "ai_task_refund") {
    return "AI 任务失败退回";
  }

  return ledger.remark || "积分变动";
}

function statusText(status: CreditLedger["status"]) {
  return status === "posted" ? "已完成" : "已作废";
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  })
    .format(new Date(value))
    .replace(/\//g, "-");
}

function aiCostRemark(task: Pick<AiTask, "type">) {
  const label: Record<AiTask["type"], string> = {
    strategy_generation: "策略生成",
    code_conversion: "代码转换",
    code_analysis: "代码解析"
  };

  return `${label[task.type]}消耗`;
}
