import type { NextRequest } from "next/server";
import { loginWithSmsCode } from "@/server/auth/auth-service";
import { setSessionCookie } from "@/server/auth/session";
import { ok, withApiHandler } from "@/server/http/api-response";
import { getStringField, readJsonObject } from "@/server/http/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  return withApiHandler(async (requestId) => {
    const body = await readJsonObject(request);
    const data = await loginWithSmsCode({
      phone: getStringField(body, "phone"),
      code: getStringField(body, "code"),
      inviteCode: getStringField(body, "inviteCode", false),
      requestId
    });
    const response = ok(data, requestId);

    setSessionCookie(response, data.user.id);

    return response;
  });
}

