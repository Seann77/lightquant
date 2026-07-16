import type { NextRequest } from "next/server";
import { getSessionUserId } from "@/server/auth/session";
import { listCreditLedgerForUser } from "@/server/credits/credit-service";
import { ApiError, ok, withApiHandler } from "@/server/http/api-response";
import type { CreditLedgerCategoryFilter, CreditLedgerFilters } from "@/server/repositories/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return withApiHandler(async (requestId) => {
    const userId = await getSessionUserId();

    if (!userId) {
      throw new ApiError("UNAUTHORIZED", "请先登录", 401);
    }

    const page = Number(request.nextUrl.searchParams.get("page") ?? "1");
    const pageSize = Number(request.nextUrl.searchParams.get("pageSize") ?? "10");
    const filters = parseLedgerFilters(request);

    return ok(await listCreditLedgerForUser(userId, { page, pageSize }, filters), requestId);
  });
}

function parseLedgerFilters(request: NextRequest): CreditLedgerFilters {
  const category = parseCategory(request.nextUrl.searchParams.get("category"));
  const createdFromParam = request.nextUrl.searchParams.get("createdFrom");
  const createdToParam = request.nextUrl.searchParams.get("createdTo");
  const createdFrom = createdFromParam ? toShanghaiDayBoundary(createdFromParam).toISOString() : undefined;
  const createdToExclusive = createdToParam ? toShanghaiDayBoundary(createdToParam, 1).toISOString() : undefined;

  if (createdFrom && createdToExclusive && createdFrom >= createdToExclusive) {
    throw new ApiError("VALIDATION_ERROR", "开始日期不能晚于结束日期", 400);
  }

  return {
    category,
    createdFrom,
    createdToExclusive
  };
}

function parseCategory(value: string | null): CreditLedgerCategoryFilter {
  if (!value || value === "all") {
    return "all";
  }

  if (value === "income" || value === "consume" || value === "refund") {
    return value;
  }

  throw new ApiError("VALIDATION_ERROR", "流水类型筛选不正确", 400);
}

function toShanghaiDayBoundary(value: string, addDays = 0) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new ApiError("VALIDATION_ERROR", "日期格式不正确", 400);
  }

  const [year, month, day] = value.split("-").map(Number);
  const baseTime = Date.UTC(year, month - 1, day);
  const baseDate = new Date(baseTime);

  if (baseDate.getUTCFullYear() !== year || baseDate.getUTCMonth() !== month - 1 || baseDate.getUTCDate() !== day) {
    throw new ApiError("VALIDATION_ERROR", "日期格式不正确", 400);
  }

  return new Date(baseTime + addDays * 24 * 60 * 60 * 1000 - 8 * 60 * 60 * 1000);
}
