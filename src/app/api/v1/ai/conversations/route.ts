import type { NextRequest } from "next/server";
import { requireSessionUserId } from "@/server/auth/session";
import { listAiConversationsForUser } from "@/server/ai/ai-service";
import { ok, withApiHandler } from "@/server/http/api-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return withApiHandler(async (requestId) => {
    const userId = await requireSessionUserId();
    const data = await listAiConversationsForUser(userId, {
      page: getNumberParam(request, "page"),
      pageSize: getNumberParam(request, "pageSize"),
      cursor: request.nextUrl.searchParams.get("cursor") ?? undefined,
      limit: getNumberParam(request, "limit"),
      mode: request.nextUrl.searchParams.get("mode") ?? undefined,
      status: request.nextUrl.searchParams.get("status") ?? undefined
    });

    return ok(data, requestId);
  });
}

function getNumberParam(request: NextRequest, name: string) {
  const value = request.nextUrl.searchParams.get(name);

  return value === null ? undefined : Number(value);
}
