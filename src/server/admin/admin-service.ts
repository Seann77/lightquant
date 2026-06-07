import type { AiTaskStatus, AiTaskType, OrderStatus, Pagination, UploadedFileScanStatus } from "@/server/domain";
import { requireAdmin } from "@/server/admin/admin-auth";
import { getRepository } from "@/server/repositories";
import { ApiError } from "@/server/http/api-response";

export async function getAdminOverview() {
  await requireAdmin();

  return getRepository().getAdminOverview(getTodayStartIso());
}

export async function listAdminUsers(input: { page: number; pageSize: number; phone?: string }) {
  await requireAdmin();

  return toPageResponse(await getRepository().listAdminUsers(normalizePagination(input), {
    phone: normalizeOptional(input.phone)
  }), input);
}

export async function listAdminOrders(input: { page: number; pageSize: number; status?: string }) {
  await requireAdmin();

  return toPageResponse(await getRepository().listAdminOrders(normalizePagination(input), {
    status: input.status ? normalizeOrderStatus(input.status) : undefined
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

function toPageResponse<T extends { items: unknown[]; total: number }>(page: T, input: Pagination) {
  return {
    ...page,
    page: input.page,
    pageSize: input.pageSize,
    totalPages: Math.max(1, Math.ceil(page.total / input.pageSize))
  };
}
