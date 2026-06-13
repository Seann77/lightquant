import type { NextRequest } from "next/server";
import { requireSessionUserId } from "@/server/auth/session";
import { retryAiTaskForUser } from "@/server/ai/ai-service";
import { scheduleAiTaskRun } from "@/server/ai/ai-task-runner";
import { ok, withApiHandler } from "@/server/http/api-response";
import { getStringField, readJsonObject } from "@/server/http/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    taskId: string;
  }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  return withApiHandler(async (requestId) => {
    const userId = await requireSessionUserId();
    const { taskId } = await context.params;
    const body = await readJsonObject(request);
    const data = await retryAiTaskForUser(userId, taskId, getStringField(body, "clientRequestId"), requestId);

    if (!data.result && (data.task.status === "PENDING" || data.task.status === "RUNNING")) {
      scheduleAiTaskRun(data.task.id, requestId);
    }

    return ok(data, requestId, {
      status: data.result ? 200 : 202
    });
  });
}
