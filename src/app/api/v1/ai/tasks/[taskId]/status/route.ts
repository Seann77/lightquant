import type { NextRequest } from "next/server";
import { requireSessionUserId } from "@/server/auth/session";
import { getAiTaskStatusForUser } from "@/server/ai/ai-service";
import { scheduleAiTaskRun } from "@/server/ai/ai-task-runner";
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
    const startedAt = Date.now();
    const userId = await requireSessionUserId();
    const { taskId } = await context.params;
    const afterSeqValue = request.nextUrl.searchParams.get("afterSeq");
    const limitValue = request.nextUrl.searchParams.get("limit");
    const data = await getAiTaskStatusForUser(userId, taskId, {
      afterSeq: afterSeqValue === null ? undefined : Number(afterSeqValue),
      limit: limitValue === null ? undefined : Number(limitValue)
    });

    if (!data.result && (data.task.status === "PENDING" || data.task.status === "RUNNING")) {
      scheduleAiTaskRun(data.task.id, requestId);
    }

    console.info("[ai-perf] tasks.status", {
      requestId,
      taskId,
      status: data.task.status,
      events: data.latestEvents?.length ?? 0,
      hasResult: Boolean(data.result),
      durationMs: Date.now() - startedAt
    });

    return ok(data, requestId);
  });
}
