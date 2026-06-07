import type { NextRequest } from "next/server";
import { closeExpiredOrders } from "@/server/billing/billing-service";
import { ok, withApiHandler } from "@/server/http/api-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  return withApiHandler(async (requestId) => {
    const data = await closeExpiredOrders({
      maintenanceSecret: request.headers.get("x-maintenance-secret")
    });

    return ok(data, requestId);
  });
}
