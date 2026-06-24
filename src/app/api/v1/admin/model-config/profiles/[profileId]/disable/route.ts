import type { NextRequest } from "next/server";
import { setAdminAiModelProfileEnabled } from "@/server/admin/model-config-service";
import { ok, withApiHandler } from "@/server/http/api-response";
import { getClientIp } from "@/server/http/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  return withApiHandler(async (requestId) => {
    const { profileId } = await params;

    return ok(await setAdminAiModelProfileEnabled(profileId, false, {
      requestId,
      requestIp: getClientIp(request)
    }), requestId);
  });
}
