import type { NextRequest } from "next/server";
import { getAiConversationForUser, updateAiConversationForUser } from "@/server/ai/ai-service";
import { requireSessionUserId } from "@/server/auth/session";
import { ok, withApiHandler } from "@/server/http/api-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    conversationId: string;
  }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  return withApiHandler(async (requestId) => {
    const userId = await requireSessionUserId();
    const { conversationId } = await context.params;

    return ok(await getAiConversationForUser(userId, conversationId), requestId);
  });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return withApiHandler(async (requestId) => {
    const userId = await requireSessionUserId();
    const { conversationId } = await context.params;
    const input = await request.json().catch(() => ({}));

    return ok(await updateAiConversationForUser(userId, conversationId, input), requestId);
  });
}
