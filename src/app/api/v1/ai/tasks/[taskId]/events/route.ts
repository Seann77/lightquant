import type { NextRequest } from "next/server";
import { requireSessionUserId } from "@/server/auth/session";
import { listAiTaskEventsForUser } from "@/server/ai/ai-service";
import { ok, withApiHandler } from "@/server/http/api-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    taskId: string;
  }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  return withApiHandler(async (requestId) => {
    const userId = await requireSessionUserId();
    const { taskId } = await context.params;
    const afterSeqValue = request.nextUrl.searchParams.get("afterSeq");
    const limitValue = request.nextUrl.searchParams.get("limit");
    const data = await listAiTaskEventsForUser(userId, taskId, {
      afterSeq: afterSeqValue === null ? undefined : Number(afterSeqValue),
      limit: limitValue === null ? undefined : Number(limitValue)
    });

    return ok(data, requestId);
  });
}
