import type { NextRequest } from "next/server";
import { handleVerifiedPaymentNotify } from "@/server/billing/billing-service";
import { createRequestId } from "@/server/http/api-response";
import { parseAndVerifyAlipayNotify } from "@/server/payments/providers/alipay-provider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const requestId = createRequestId();

  try {
    const notify = parseAndVerifyAlipayNotify(await request.formData());
    await handleVerifiedPaymentNotify(
      {
        provider: "alipay",
        orderNo: notify.outTradeNo,
        providerTradeNo: notify.tradeNo,
        notifyId: notify.notifyId,
        amountCents: notify.totalAmountCents,
        rawPayload: notify.rawPayload
      },
      requestId
    );

    return new Response("success", {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8"
      }
    });
  } catch {
    return new Response("failure", {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8"
      }
    });
  }
}
