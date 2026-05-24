import type { NextRequest } from "next/server";
import { requireSessionUserId } from "@/server/auth/session";
import { createRechargeOrder } from "@/server/billing/billing-service";
import { ok, withApiHandler } from "@/server/http/api-response";
import { getStringField, readJsonObject } from "@/server/http/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  return withApiHandler(async (requestId) => {
    const userId = await requireSessionUserId();
    const body = await readJsonObject(request);
    const data = await createRechargeOrder(userId, {
      planId: getStringField(body, "planId"),
      payChannel: getStringField(body, "payChannel"),
      clientRequestId: getStringField(body, "clientRequestId")
    });

    return ok(data, requestId);
  });
}

