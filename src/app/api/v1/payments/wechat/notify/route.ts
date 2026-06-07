import type { NextRequest } from "next/server";
import { handleVerifiedPaymentNotify } from "@/server/billing/billing-service";
import { createRequestId } from "@/server/http/api-response";
import { parseAndVerifyWechatNotify } from "@/server/payments/providers/wechat-provider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const requestId = createRequestId();

  try {
    const rawBody = await request.text();
    const notify = parseAndVerifyWechatNotify(request.headers, rawBody);
    await handleVerifiedPaymentNotify(
      {
        provider: "wechat",
        orderNo: notify.outTradeNo,
        providerTradeNo: notify.transactionId,
        notifyId: notify.transactionId,
        amountCents: notify.amountCents,
        rawPayload: notify.rawPayload
      },
      requestId
    );

    return Response.json({
      code: "SUCCESS",
      message: "成功"
    });
  } catch {
    return Response.json({
      code: "FAIL",
      message: "失败"
    });
  }
}
