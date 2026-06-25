import type { NextRequest } from "next/server";
import { createAdminAiModelProfile } from "@/server/admin/model-config-service";
import { ok, withApiHandler } from "@/server/http/api-response";
import { getClientIp, getStringField, readJsonObject } from "@/server/http/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  return withApiHandler(async (requestId) => {
    const body = await readJsonObject(request);

    return ok(await createAdminAiModelProfile({
      name: getStringField(body, "name"),
      provider: getStringField(body, "provider"),
      baseUrl: getStringField(body, "baseUrl"),
      model: getStringField(body, "model"),
      supportsVision: getBooleanField(body, "supportsVision"),
      apiKeyEnvName: getStringField(body, "apiKeyEnvName", false),
      apiKeySecretId: getStringField(body, "apiKeySecretId", false),
      enabled: getBooleanField(body, "enabled"),
      requestId,
      requestIp: getClientIp(request)
    }), requestId);
  });
}

function getBooleanField(body: Record<string, unknown>, field: string) {
  const value = body[field];

  return value === true;
}
