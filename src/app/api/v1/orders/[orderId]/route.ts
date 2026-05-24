import type { NextRequest } from "next/server";
import { requireSessionUserId } from "@/server/auth/session";
import { getOrderForUser } from "@/server/billing/billing-service";
import { ok, withApiHandler } from "@/server/http/api-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    orderId: string;
  }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  return withApiHandler(async (requestId) => {
    const userId = await requireSessionUserId();
    const { orderId } = await context.params;

    return ok(await getOrderForUser(userId, orderId), requestId);
  });
}

