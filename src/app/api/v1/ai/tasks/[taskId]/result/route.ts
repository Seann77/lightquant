import type { NextRequest } from "next/server";
import { requireSessionUserId } from "@/server/auth/session";
import { getAiTaskResultForUser } from "@/server/ai/ai-service";
import { scheduleAiTaskRun } from "@/server/ai/ai-task-runner";
import { ok, withApiHandler } from "@/server/http/api-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    taskId: string;
  }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  return withApiHandler(async (requestId) => {
    const userId = await requireSessionUserId();
    const { taskId } = await context.params;
    const data = await getAiTaskResultForUser(userId, taskId);

    if (!data.result && (data.task.status === "PENDING" || data.task.status === "RUNNING")) {
      scheduleAiTaskRun(data.task.id, requestId);
    }

    return ok(data, requestId);
  });
}
