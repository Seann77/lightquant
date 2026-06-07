import type { NextRequest } from "next/server";
import { listAdminAiTasks } from "@/server/admin/admin-service";
import { ok, withApiHandler } from "@/server/http/api-response";
import { getAdminListParams, getOptionalParam } from "@/app/api/v1/admin/admin-request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return withApiHandler(async (requestId) => ok(await listAdminAiTasks({
    ...getAdminListParams(request),
    type: getOptionalParam(request, "type"),
    status: getOptionalParam(request, "status")
  }), requestId));
}
