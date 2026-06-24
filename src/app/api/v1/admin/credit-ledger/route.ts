import type { NextRequest } from "next/server";
import { listAdminCreditLedger } from "@/server/admin/admin-service";
import { ok, withApiHandler } from "@/server/http/api-response";
import { getAdminListParams, getOptionalParam } from "@/app/api/v1/admin/admin-request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return withApiHandler(async (requestId) => ok(await listAdminCreditLedger({
    ...getAdminListParams(request),
    phone: getOptionalParam(request, "phone"),
    type: getOptionalParam(request, "type"),
    direction: getOptionalParam(request, "direction"),
    createdFrom: getOptionalParam(request, "createdFrom"),
    createdTo: getOptionalParam(request, "createdTo")
  }), requestId));
}
