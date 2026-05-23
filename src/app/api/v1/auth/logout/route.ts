import { clearSessionCookie } from "@/server/auth/session";
import { ok, withApiHandler } from "@/server/http/api-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  return withApiHandler(async (requestId) => {
    const response = ok({ loggedOut: true }, requestId);

    clearSessionCookie(response);

    return response;
  });
}

