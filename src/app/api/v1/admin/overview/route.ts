import { getAdminOverview } from "@/server/admin/admin-service";
import { ok, withApiHandler } from "@/server/http/api-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return withApiHandler(async (requestId) => ok(await getAdminOverview(), requestId));
}
