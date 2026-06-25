import type { NextRequest } from "next/server";
import { setAdminAiModelProfileEnabled } from "@/server/admin/model-config-service";
import { ok, withApiHandler } from "@/server/http/api-response";
import { getClientIp } from "@/server/http/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    profileId: string;
  }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  return withApiHandler(async (requestId) => {
    const { profileId } = await context.params;

    return ok(await setAdminAiModelProfileEnabled({
      profileId,
      enabled: false,
      requestId,
      requestIp: getClientIp(request)
    }), requestId);
  });
}
