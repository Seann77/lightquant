import { randomUUID } from "crypto";
import type {
  AiTaskStatus,
  AiTaskType,
  ContactCategory,
  ContactMethod,
  CreditLedgerDirection,
  CreditLedgerType,
  OrderStatus,
  Pagination,
  UploadedFileScanStatus
} from "@/server/domain";
import { requireAdmin } from "@/server/admin/admin-auth";
import { isAdminWriteEnabled } from "@/server/env";
import { getRepository } from "@/server/repositories";
import { ApiError } from "@/server/http/api-response";

export async function getAdminOverview() {
  await requireAdmin();

  return getRepository().getAdminOverview(getTodayStartIso());
}

export async function listAdminUsers(input: { page: number; pageSize: number; phone?: string; createdFrom?: string; createdTo?: string }) {
  await requireAdmin();
  const range = normalizeDateRange(input.createdFrom, input.createdTo, "注册开始时间", "注册结束时间");

  return toPageResponse(await getRepository().listAdminUsers(normalizePagination(input), {
    phone: normalizeOptional(input.phone),
    createdFrom: range.createdFrom,
    createdTo: range.createdTo
  }), input);
}

export async function listAdminCreditLedger(input: {
  page: number;
  pageSize: number;
  phone?: string;
  type?: string;
  direction?: string;
  createdFrom?: string;
  createdTo?: string;
}) {
  await requireAdmin();
  const range = normalizeDateRange(input.createdFrom, input.createdTo, "开始时间", "结束时间");

  return toPageResponse(await getRepository().listAdminCreditLedger(normalizePagination(input), {
    phone: normalizeOptional(input.phone),
    type: input.type ? normalizeCreditLedgerType(input.type) : undefined,
    direction: input.direction ? normalizeCreditLedgerDirection(input.direction) : undefined,
    createdFrom: range.createdFrom,
    createdTo: range.createdTo
  }), input);
}

export async function adjustAdminUserCredits(input: {
  phone: string;
  amount: number;
  reason: string;
  note?: string;
  requestId: string;
  requestIp: string | null;
  clientRequestId?: string;
}) {
  const admin = await requireAdmin();

  if (!isAdminWriteEnabled()) {
    throw new ApiError("FORBIDDEN", "后台写操作未开启", 403);
  }

  const phone = normalizePhone(input.phone);
  const amount = normalizePositiveInteger(input.amount, "补积分数量");
  const reason = normalizeLength(input.reason, "补积分原因", 5, 200);
  const note = normalizeOptionalLength(input.note, "备注", 200);
  const targetUser = await getRepository().findUserByPhone(phone);

  if (!targetUser || targetUser.status !== "active") {
    throw new ApiError("NOT_FOUND", "用户不存在或不可用", 404);
  }

  const now = new Date().toISOString();
  const clientRequestId = normalizeClientRequestId(input.clientRequestId) ?? randomUUID();
  const remark = note ? `管理员补积分：${reason}；备注：${note}` : `管理员补积分：${reason}`;
  const result = await getRepository().applyAdminCreditAdjustment({
    ledger: {
      userId: targetUser.id,
      requestId: input.requestId,
      scene: "admin_credit_adjustment",
      type: "bonus",
      direction: "in",
      amount,
      sourceType: "admin_adjustment",
      sourceId: clientRequestId,
      idempotencyKey: `admin_credit_adjustment:${clientRequestId}`,
      remark,
      createdAt: now
    },
    audit: {
      adminUserId: admin.user.id,
      adminPhone: admin.user.phone,
      action: "credit.adjust",
      targetType: "user",
      targetId: targetUser.id,
      summary: `管理员为用户 ${maskPhone(targetUser.phone)} 补 ${amount} 积分`,
      metadata: {
        targetPhoneMasked: maskPhone(targetUser.phone),
        amount,
        reason,
        note: note ?? null,
        sourceType: "admin_adjustment",
        sourceId: clientRequestId
      },
      requestId: input.requestId,
      requestIp: input.requestIp,
      createdAt: now
    }
  });

  return {
    account: result.account,
    ledger: result.ledger,
    duplicated: result.duplicated
  };
}

export async function listAdminOrders(input: { page: number; pageSize: number; phone?: string; status?: string; createdFrom?: string; createdTo?: string }) {
  await requireAdmin();
  const range = normalizeDateRange(input.createdFrom, input.createdTo, "开始时间", "结束时间");

  return toPageResponse(await getRepository().listAdminOrders(normalizePagination(input), {
    phone: normalizeOptional(input.phone),
    status: input.status ? normalizeOrderStatus(input.status) : undefined,
    createdFrom: range.createdFrom,
    createdTo: range.createdTo
  }), input);
}

export async function listAdminAiTasks(input: { page: number; pageSize: number; type?: string; status?: string }) {
  await requireAdmin();

  return toPageResponse(await getRepository().listAdminAiTasks(normalizePagination(input), {
    type: input.type ? normalizeAiTaskType(input.type) : undefined,
    status: input.status ? normalizeAiTaskStatus(input.status) : undefined
  }), input);
}

export async function listAdminFiles(input: { page: number; pageSize: number; scanStatus?: string }) {
  await requireAdmin();

  return toPageResponse(await getRepository().listAdminUploadedFiles(normalizePagination(input), {
    scanStatus: input.scanStatus ? normalizeScanStatus(input.scanStatus) : undefined
  }), input);
}

export async function listAdminContactRequests(input: {
  page: number;
  pageSize: number;
  keyword?: string;
  contactMethod?: string;
  category?: string;
  source?: string;
  createdFrom?: string;
  createdTo?: string;
}) {
  await requireAdmin();
  const range = normalizeDateRange(input.createdFrom, input.createdTo, "开始时间", "结束时间");

  return toPageResponse(await getRepository().listAdminContactRequests(normalizePagination(input), {
    keyword: normalizeOptional(input.keyword),
    contactMethod: input.contactMethod ? normalizeContactMethod(input.contactMethod) : undefined,
    category: input.category ? normalizeContactCategory(input.category) : undefined,
    source: normalizeOptional(input.source),
    createdFrom: range.createdFrom,
    createdTo: range.createdTo
  }), input);
}

function getTodayStartIso() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);

  return date.toISOString();
}

function normalizePagination(input: Pagination): Pagination {
  if (!Number.isInteger(input.page) || input.page < 1) {
    throw new ApiError("VALIDATION_ERROR", "分页页码不正确", 400);
  }

  if (!Number.isInteger(input.pageSize) || input.pageSize < 1 || input.pageSize > 100) {
    throw new ApiError("VALIDATION_ERROR", "分页大小不正确", 400);
  }

  return input;
}

function normalizeOptional(value: string | undefined) {
  const normalized = value?.trim();

  return normalized || undefined;
}

function normalizeDateRange(createdFrom: string | undefined, createdTo: string | undefined, fromLabel: string, toLabel: string) {
  const from = normalizeDateBoundary(createdFrom, fromLabel, 0);
  const to = normalizeDateBoundary(createdTo, toLabel, 1);

  if (from && to && from >= to) {
    throw new ApiError("VALIDATION_ERROR", "开始时间必须早于结束时间", 400);
  }

  return {
    createdFrom: from,
    createdTo: to
  };
}

function normalizeDateBoundary(value: string | undefined, label: string, addDays: number) {
  const normalized = normalizeOptional(value);

  if (!normalized) {
    return undefined;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(normalized);

  if (!match) {
    throw new ApiError("VALIDATION_ERROR", `${label}格式不正确`, 400);
  }

  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]) + addDays);

  if (Number.isNaN(date.getTime())) {
    throw new ApiError("VALIDATION_ERROR", `${label}格式不正确`, 400);
  }

  return date.toISOString();
}

function normalizePhone(value: string) {
  const phone = value.trim();

  if (!/^1\d{10}$/.test(phone)) {
    throw new ApiError("VALIDATION_ERROR", "手机号格式不正确", 400);
  }

  return phone;
}

function normalizePositiveInteger(value: number, label: string) {
  if (!Number.isInteger(value) || value <= 0 || value > 1_000_000) {
    throw new ApiError("VALIDATION_ERROR", `${label}必须是 1 到 1000000 的整数`, 400);
  }

  return value;
}

function normalizeLength(value: string, label: string, min: number, max: number) {
  const normalized = value.trim();

  if (normalized.length < min || normalized.length > max) {
    throw new ApiError("VALIDATION_ERROR", `${label}需为 ${min}-${max} 个字符`, 400);
  }

  return normalized;
}

function normalizeOptionalLength(value: string | undefined, label: string, max: number) {
  const normalized = normalizeOptional(value);

  if (normalized && normalized.length > max) {
    throw new ApiError("VALIDATION_ERROR", `${label}最多 ${max} 个字符`, 400);
  }

  return normalized;
}

function normalizeClientRequestId(value: string | undefined) {
  const normalized = normalizeOptional(value);

  if (!normalized) {
    return undefined;
  }

  if (!/^[A-Za-z0-9:_-]{8,120}$/.test(normalized)) {
    throw new ApiError("VALIDATION_ERROR", "clientRequestId 参数不正确", 400);
  }

  return normalized;
}

function normalizeOrderStatus(value: string): OrderStatus {
  if (value === "PENDING" || value === "PAID" || value === "CLOSED" || value === "FAILED") {
    return value;
  }

  throw new ApiError("VALIDATION_ERROR", "订单状态不正确", 400);
}

function normalizeAiTaskType(value: string): AiTaskType {
  if (value === "strategy_generation" || value === "code_conversion" || value === "code_analysis") {
    return value;
  }

  throw new ApiError("VALIDATION_ERROR", "AI 任务类型不正确", 400);
}

function normalizeAiTaskStatus(value: string): AiTaskStatus {
  if (value === "PENDING" || value === "RUNNING" || value === "SUCCEEDED" || value === "FAILED" || value === "CANCELLED") {
    return value;
  }

  throw new ApiError("VALIDATION_ERROR", "AI 任务状态不正确", 400);
}

function normalizeScanStatus(value: string): UploadedFileScanStatus {
  if (value === "PASSED" || value === "WARNING" || value === "BLOCKED") {
    return value;
  }

  throw new ApiError("VALIDATION_ERROR", "文件扫描状态不正确", 400);
}

function normalizeContactMethod(value: string): ContactMethod {
  if (value === "邮箱" || value === "微信号" || value === "手机号") {
    return value;
  }

  throw new ApiError("VALIDATION_ERROR", "联系方式类型不正确", 400);
}

function normalizeContactCategory(value: string): ContactCategory {
  if (value === "使用问题" || value === "策略生成" || value === "代码转换" || value === "积分/充值" || value === "其他") {
    return value;
  }

  throw new ApiError("VALIDATION_ERROR", "问题类型不正确", 400);
}

function normalizeCreditLedgerType(value: string): CreditLedgerType {
  if (value === "bonus" || value === "recharge" || value === "consume" || value === "refund") {
    return value;
  }

  throw new ApiError("VALIDATION_ERROR", "流水类型不正确", 400);
}

function normalizeCreditLedgerDirection(value: string): CreditLedgerDirection {
  if (value === "in" || value === "out") {
    return value;
  }

  throw new ApiError("VALIDATION_ERROR", "流水方向不正确", 400);
}

function maskPhone(phone: string) {
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}

function toPageResponse<T extends { items: unknown[]; total: number }>(page: T, input: Pagination) {
  return {
    ...page,
    page: input.page,
    pageSize: input.pageSize,
    totalPages: Math.max(1, Math.ceil(page.total / input.pageSize))
  };
}
