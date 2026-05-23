import type { NextRequest } from "next/server";
import { getSessionUserId } from "@/server/auth/session";
import { listCreditLedgerForUser } from "@/server/credits/credit-service";
import { ApiError, ok, withApiHandler } from "@/server/http/api-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return withApiHandler(async (requestId) => {
    const userId = await getSessionUserId();

    if (!userId) {
      throw new ApiError("UNAUTHORIZED", "请先登录", 401);
    }

    const page = Number(request.nextUrl.searchParams.get("page") ?? "1");
    const pageSize = Number(request.nextUrl.searchParams.get("pageSize") ?? "20");

    return ok(await listCreditLedgerForUser(userId, { page, pageSize }), requestId);
  });
}

