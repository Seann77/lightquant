import type { NextRequest } from "next/server";
import { handleMockPaymentNotify } from "@/server/billing/billing-service";
import { ok, withApiHandler } from "@/server/http/api-response";
import { getNumberField, getStringField, readJsonObject } from "@/server/http/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  return withApiHandler(async (requestId) => {
    const body = await readJsonObject(request);
    const data = await handleMockPaymentNotify(
      {
        orderId: getStringField(body, "orderId", false),
        orderNo: getStringField(body, "orderNo", false),
        mockTradeNo: getStringField(body, "mockTradeNo", false),
        amountCents: getNumberField(body, "amountCents")
      },
      requestId
    );

    return ok(data, requestId);
  });
}

