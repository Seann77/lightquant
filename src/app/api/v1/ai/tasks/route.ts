import type { NextRequest } from "next/server";
import { requireSessionUserId } from "@/server/auth/session";
import { createAiTask, listAiTasksForUser } from "@/server/ai/ai-service";
import { scheduleAiTaskRun } from "@/server/ai/ai-task-runner";
import { ok, withApiHandler } from "@/server/http/api-response";
import { getStringField, readJsonObject } from "@/server/http/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  return withApiHandler(async (requestId) => {
    const userId = await requireSessionUserId();
    const body = await readJsonObject(request);
    const data = await createAiTask(
      userId,
      {
        type: getStringField(body, "type"),
        conversationId: getStringField(body, "conversationId", false),
        messageContent: getStringField(body, "messageContent", false),
        sourcePlatform: getStringField(body, "sourcePlatform", false),
        targetPlatform: getStringField(body, "targetPlatform", false),
        prompt: getStringField(body, "prompt", false),
        inputCode: getStringField(body, "inputCode", false),
        inputFileId: getStringField(body, "inputFileId", false),
        clientRequestId: getStringField(body, "clientRequestId")
      },
      requestId
    );

    if (!data.result && (data.task.status === "PENDING" || data.task.status === "RUNNING")) {
      scheduleAiTaskRun(data.task.id, requestId);
    }

    return ok(data, requestId, {
      status: data.result ? 200 : 202
    });
  });
}

export async function GET(request: NextRequest) {
  return withApiHandler(async (requestId) => {
    const userId = await requireSessionUserId();
    const page = Number(request.nextUrl.searchParams.get("page") ?? "1");
    const pageSize = Number(request.nextUrl.searchParams.get("pageSize") ?? "20");
    const data = await listAiTasksForUser(userId, { page, pageSize }, {
      type: request.nextUrl.searchParams.get("type") ?? undefined,
      status: request.nextUrl.searchParams.get("status") ?? undefined
    });

    return ok(data, requestId);
  });
}
