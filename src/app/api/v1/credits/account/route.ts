import { getSessionUserId } from "@/server/auth/session";
import { getCreditAccountForUser } from "@/server/credits/credit-service";
import { ApiError, ok, withApiHandler } from "@/server/http/api-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return withApiHandler(async (requestId) => {
    const userId = await getSessionUserId();

    if (!userId) {
      throw new ApiError("UNAUTHORIZED", "请先登录", 401);
    }

    return ok({ account: await getCreditAccountForUser(userId) }, requestId);
  });
}

