import type { NextRequest } from "next/server";
import { previewAdminUserCreditAdjustment } from "@/server/admin/admin-service";
import { ok, withApiHandler } from "@/server/http/api-response";
import { getNumberField, getStringField, readJsonObject } from "@/server/http/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  return withApiHandler(async (requestId) => {
    const body = await readJsonObject(request);

    return ok(await previewAdminUserCreditAdjustment({
      phone: getStringField(body, "phone"),
      amount: getNumberField(body, "amount"),
      reason: getStringField(body, "reason"),
      note: getStringField(body, "note", false)
    }), requestId);
  });
}
