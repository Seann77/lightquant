import type { CreditAccount, CreditLedger, Pagination } from "@/server/domain";
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

