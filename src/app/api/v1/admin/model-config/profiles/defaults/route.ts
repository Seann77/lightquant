import type { NextRequest } from "next/server";
import { createDefaultAdminAiModelProfiles } from "@/server/admin/model-config-service";
import { ok, withApiHandler } from "@/server/http/api-response";
import { getClientIp } from "@/server/http/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  return withApiHandler(async (requestId) => ok(await createDefaultAdminAiModelProfiles({
    requestId,
    requestIp: getClientIp(request)
  }), requestId));
}
