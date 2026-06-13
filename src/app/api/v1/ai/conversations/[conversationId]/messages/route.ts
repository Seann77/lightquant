import type { NextRequest } from "next/server";
import { requireSessionUserId } from "@/server/auth/session";
import { getAiConversationMessagesForUser } from "@/server/ai/ai-service";
import { ok, withApiHandler } from "@/server/http/api-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    conversationId: string;
  }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  return withApiHandler(async (requestId) => {
    const userId = await requireSessionUserId();
    const { conversationId } = await context.params;
    const data = await getAiConversationMessagesForUser(userId, conversationId, {
      cursor: request.nextUrl.searchParams.get("cursor") ?? undefined,
      direction: request.nextUrl.searchParams.get("direction") ?? undefined,
      limit: getNumberParam(request, "limit"),
      taskLimit: getNumberParam(request, "taskLimit"),
      includeTaskResults: request.nextUrl.searchParams.get("includeTaskResults") ?? undefined
    });

    return ok(data, requestId);
  });
}

function getNumberParam(request: NextRequest, name: string) {
  const value = request.nextUrl.searchParams.get(name);

  return value === null ? undefined : Number(value);
}
