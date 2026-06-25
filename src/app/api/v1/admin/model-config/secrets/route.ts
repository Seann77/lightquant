import type { NextRequest } from "next/server";
import { upsertAdminAiModelSecret } from "@/server/admin/model-config-service";
import { ok, withApiHandler } from "@/server/http/api-response";
import { getClientIp, getStringField, readJsonObject } from "@/server/http/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  return withApiHandler(async (requestId) => {
    const body = await readJsonObject(request);

    return ok(await upsertAdminAiModelSecret({
      secretId: getStringField(body, "secretId", false),
      name: getStringField(body, "name"),
      provider: getStringField(body, "provider", false),
      apiKey: getStringField(body, "apiKey"),
      requestId,
      requestIp: getClientIp(request)
    }), requestId);
  });
}
