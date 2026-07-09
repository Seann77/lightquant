import type { AiTask, CreditAccount, CreditLedger, CreditReservation, Pagination, RechargeOrder } from "@/server/domain";
import { ApiError } from "@/server/http/api-response";
import { getAiPerfNow, logAiPerf, measureAiPerf } from "@/server/ai/ai-perf";
import { getRepository } from "@/server/repositories";
import type { CreditLedgerFilters } from "@/server/repositories/types";

const SIGNUP_BONUS_POINTS = 300;
export const INVITE_BONUS_POINTS = 200;

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

type LedgerDisplayContext = {
  orderNoById: Map<string, string>;
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
    remark: "新用户注册赠送 300 基础积分",
    createdAt: now
  });
}

export async function applyInviteBonus(input: { inviterUserId: string; newUserId: string; requestId: string }) {
  const now = new Date().toISOString();
  const repository = getRepository();

  return repository.applyCreditLedger({
    userId: input.inviterUserId,
    requestId: input.requestId,
    scene: "invite_bonus",
    type: "bonus",
    direction: "in",
    amount: INVITE_BONUS_POINTS,
    sourceType: "invite",
    sourceId: input.newUserId,
    idempotencyKey: `invite_bonus:${input.newUserId}`,
    remark: "推荐新用户注册奖励 200 积分",
    createdAt: now
  });
}

export async function applyRechargeCredit(order: RechargeOrder, requestId: string) {
  const now = new Date().toISOString();
  const repository = getRepository();
  const planMeta = getRechargePlanCreditMeta(order.planId, order.paidAt ?? now);

  return repository.applyCreditLedger({
    userId: order.userId,
    requestId,
    scene: planMeta.scene,
    type: "recharge",
    direction: "in",
    amount: order.totalPoints,
    sourceType: "recharge",
    sourceId: order.id,
    idempotencyKey: `recharge:${order.id}`,
    remark: `${planMeta.title}：订单 ${order.orderNo}，获得 ${order.totalPoints.toLocaleString("zh-CN")} 积分`,
    createdAt: now,
    grantType: planMeta.grantType,
    grantExpiresAt: planMeta.expiresAt
  });
}

export async function reserveCredits(input: { userId: string; taskId: string; amount: number }) {
  const startedAt = getAiPerfNow();
  if (!Number.isInteger(input.amount) || input.amount <= 0) {
    throw new ApiError("VALIDATION_ERROR", "积分预占金额不正确", 400);
  }

  const repository = getRepository();
  const idempotencyKey = `ai_task_reserve:${input.taskId}`;
  const now = new Date().toISOString();
  await repository.expireCreditGrantsForUser(input.userId, now, `reserve:${input.taskId}`);

  const reservation = await measureAiPerf("credits.reserve.create_reservation", {
    taskId: input.taskId,
    amount: input.amount
  }, () => repository.createCreditReservation({
    userId: input.userId,
    taskId: input.taskId,
    amount: input.amount,
    status: "RESERVED",
    idempotencyKey,
    expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    createdAt: now,
    updatedAt: now
  }));
  const duplicated = reservation.createdAt !== now;
  logAiPerf("credits.reserve.total", {
    taskId: input.taskId,
    amount: input.amount,
    duplicated,
    durationMs: getAiPerfNow() - startedAt
  });

  return {
    reservation,
    duplicated
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
  const now = new Date().toISOString();
  await repository.expireCreditGrantsForUser(userId, now, `account:${userId}:${now}`);
  const account = await repository.ensureCreditAccount(userId, now);
  const grantSummary = await repository.getCreditGrantSummary(userId, now);

  return toCreditAccountResponse({
    ...account,
    ...grantSummary
  });
}

export async function listCreditLedgerForUser(userId: string, pagination: Pagination, filters: CreditLedgerFilters = {}) {
  const repository = getRepository();
  const safePagination = normalizePagination(pagination);
  const page = await repository.listCreditLedger(userId, safePagination, filters);
  const orderNoById = await getRechargeOrderNoMap(page.items);

  return {
    items: page.items.map((item) => toCreditLedgerResponseItem(item, { orderNoById })),
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
    monthlyBalance: account.monthlyBalance ?? 0,
    permanentBalance: account.permanentBalance ?? account.balance,
    monthlyPlanId: account.monthlyPlanId ?? null,
    monthlyPlanName: account.monthlyPlanName ?? null,
    monthlyExpiresAt: account.monthlyExpiresAt ?? null,
    totalEarned: account.totalEarned,
    totalSpent: account.totalSpent,
    version: account.version,
    updatedAt: account.updatedAt
  };
}

function getRechargePlanCreditMeta(planId: string, paidAt: string) {
  if (planId === "monthly_plus" || planId === "monthly_pro") {
    return {
      grantType: "monthly" as const,
      expiresAt: new Date(new Date(paidAt).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      scene: "recharge_monthly",
      title: "月卡充值到账"
    };
  }

  if (planId === "promo") {
    return {
      grantType: "permanent" as const,
      expiresAt: null,
      scene: "recharge_promo",
      title: "积分包充值到账"
    };
  }

  return {
    grantType: "permanent" as const,
    expiresAt: null,
    scene: "recharge_permanent",
    title: "积分包充值到账"
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

async function getRechargeOrderNoMap(items: CreditLedger[]) {
  const repository = getRepository();
  const orderIds = Array.from(new Set(
    items
      .filter((item) => item.type === "recharge" && item.sourceType === "recharge")
      .map((item) => item.sourceId)
  ));
  const entries = await Promise.all(orderIds.map(async (orderId) => {
    const order = await repository.findOrderById(orderId).catch(() => null);
    return order ? [orderId, order.orderNo] as const : null;
  }));

  return new Map(entries.filter((entry): entry is readonly [string, string] => Boolean(entry)));
}

function toCreditLedgerResponseItem(ledger: CreditLedger, context: LedgerDisplayContext): CreditLedgerResponseItem {
  const signedAmount = ledger.direction === "in" ? ledger.amount : -ledger.amount;

  return {
    id: ledger.id,
    createdAt: ledger.createdAt,
    time: formatDateTime(ledger.createdAt),
    category: categoryForLedger(ledger),
    title: titleForLedger(ledger),
    description: descriptionForLedger(ledger, context),
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
  if (ledger.type === "refund") {
    return "退回";
  }

  if (ledger.direction === "in") {
    return "获取";
  }

  return "消耗";
}

function titleForLedger(ledger: CreditLedger) {
  if (ledger.scene === "signup_bonus") {
    return "注册赠送";
  }

  if (ledger.scene === "invite_bonus") {
    return "邀请奖励";
  }

  if (ledger.scene === "recharge" || ledger.scene === "recharge_promo" || ledger.scene === "recharge_permanent" || ledger.scene === "recharge_monthly") {
    if (ledger.scene === "recharge_monthly") {
      return "月卡充值到账";
    }

    return "基础积分包充值到账";
  }

  if (ledger.scene === "ai_task" || ledger.scene === "ai_task_monthly" || ledger.scene === "ai_task_permanent") {
    const taskLabel = taskLabelFromLedger(ledger);

    return taskLabel ? `任务消耗——${taskLabel}` : "任务消耗";
  }

  if (ledger.scene === "monthly_expire") {
    return "月卡积分过期";
  }

  if (ledger.scene === "ai_task_refund") {
    const taskLabel = taskLabelFromLedger(ledger);

    return taskLabel ? `任务失败退回——${taskLabel}` : "任务失败退回";
  }

  return ledger.remark || "积分变动";
}

function descriptionForLedger(ledger: CreditLedger, context: LedgerDisplayContext) {
  if (ledger.scene === "signup_bonus") {
    return `注册赠送：获得 ${ledger.amount.toLocaleString("zh-CN")} 基础积分`;
  }

  if (ledger.scene === "invite_bonus") {
    return `邀请奖励：获得 ${ledger.amount.toLocaleString("zh-CN")} 基础积分`;
  }

  if (ledger.scene === "recharge" || ledger.scene === "recharge_monthly" || ledger.scene === "recharge_promo" || ledger.scene === "recharge_permanent") {
    const orderNo = getRechargeOrderNo(ledger, context);

    if (ledger.scene === "recharge_monthly") {
      return `月卡充值到账：订单 ${orderNo}，获得 ${ledger.amount.toLocaleString("zh-CN")} 月卡积分`;
    }

    return `基础积分包充值到账：订单 ${orderNo}，获得 ${ledger.amount.toLocaleString("zh-CN")} 基础积分`;
  }

  if (ledger.scene === "ai_task" || ledger.scene === "ai_task_monthly" || ledger.scene === "ai_task_permanent") {
    const taskLabel = taskLabelFromLedger(ledger);
    const sourceText = ledger.scene === "ai_task_monthly" ? "优先消耗月卡积分" : "消耗基础积分";

    return taskLabel ? `${taskLabel}——${sourceText}` : `任务消耗——${sourceText}`;
  }

  if (ledger.scene === "ai_task_refund") {
    const taskLabel = taskLabelFromLedger(ledger);
    const sourceText = ledger.remark.includes("月卡积分") ? "月卡积分" : "基础积分";

    return taskLabel
      ? `${taskLabel}失败：退回 ${ledger.amount.toLocaleString("zh-CN")} ${sourceText}`
      : `任务失败：退回 ${ledger.amount.toLocaleString("zh-CN")} ${sourceText}`;
  }

  if (ledger.scene === "monthly_expire") {
    return `月卡积分过期：失效 ${ledger.amount.toLocaleString("zh-CN")} 月卡积分`;
  }

  return ledger.remark;
}

function getRechargeOrderNo(ledger: CreditLedger, context: LedgerDisplayContext) {
  return context.orderNoById.get(ledger.sourceId) ?? extractOrderNo(ledger.remark) ?? ledger.sourceId;
}

function extractOrderNo(value: string) {
  return value.match(/\bLQ[A-Z0-9]{10,}\b/)?.[0] ?? null;
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
    code_analysis: "代码翻译解析"
  };

  return `${label[task.type]}消耗`;
}

function taskLabelFromLedger(ledger: CreditLedger) {
  if (ledger.remark.includes("代码翻译解析") || ledger.remark.includes("代码解析")) {
    return "代码翻译解析";
  }

  if (ledger.remark.includes("代码转换")) {
    return "代码转换";
  }

  if (ledger.remark.includes("策略生成")) {
    return "策略生成";
  }

  return null;
}
