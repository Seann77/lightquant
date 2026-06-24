import type { NextRequest } from "next/server";
import { updateAdminAiModelProfile } from "@/server/admin/model-config-service";
import { ok, withApiHandler } from "@/server/http/api-response";
import { getClientIp, readJsonObject } from "@/server/http/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  return withApiHandler(async (requestId) => {
    const [{ profileId }, body] = await Promise.all([
      params,
      readJsonObject(request)
    ]);

    return ok(await updateAdminAiModelProfile(profileId, body, {
      requestId,
      requestIp: getClientIp(request)
    }), requestId);
  });
}
