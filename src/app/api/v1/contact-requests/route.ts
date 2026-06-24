import type { NextRequest } from "next/server";
import { getSessionUserId } from "@/server/auth/session";
import { createContactRequest } from "@/server/contact/contact-service";
import { ApiError, ok, withApiHandler } from "@/server/http/api-response";
import { getClientIp, getStringField, readJsonObject } from "@/server/http/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  return withApiHandler(async (requestId) => {
    const body = await readJsonObject(request);
    const userId = await getSessionUserId();

    if (!userId) {
      throw new ApiError("UNAUTHORIZED", "请先登录后提交留言", 401);
    }

    return ok(await createContactRequest({
      userId,
      name: getStringField(body, "name"),
      contactMethod: getStringField(body, "contactMethod"),
      contactValue: getStringField(body, "contactValue"),
      category: getStringField(body, "category"),
      message: getStringField(body, "message"),
      source: getStringField(body, "source"),
      requestIp: getClientIp(request),
      userAgent: request.headers.get("user-agent")
    }), requestId);
  });
}
