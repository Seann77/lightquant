import type { NextRequest } from "next/server";
import { requestSmsCode } from "@/server/auth/auth-service";
import { ApiError, ok, withApiHandler } from "@/server/http/api-response";
import { getClientIp, getStringField, readJsonObject } from "@/server/http/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  return withApiHandler(async (requestId) => {
    const body = await readJsonObject(request);
    const phone = getStringField(body, "phone");
    const scene = getStringField(body, "scene", false);

    if (scene && scene !== "login") {
      throw new ApiError("VALIDATION_ERROR", "scene 参数不正确", 400);
    }

    const data = await requestSmsCode({
      phone,
      scene: "login",
      requestIp: getClientIp(request)
    });

    return ok(data, requestId);
  });
}
