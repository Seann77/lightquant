import type { NextRequest } from "next/server";
import { requireSessionUserId } from "@/server/auth/session";
import { cancelAiTaskForUser } from "@/server/ai/ai-service";
import { ok, withApiHandler } from "@/server/http/api-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    taskId: string;
  }>;
};

export async function POST(_request: NextRequest, context: RouteContext) {
  return withApiHandler(async (requestId) => {
    const userId = await requireSessionUserId();
    const { taskId } = await context.params;

    return ok(await cancelAiTaskForUser(userId, taskId, requestId), requestId);
  });
}
