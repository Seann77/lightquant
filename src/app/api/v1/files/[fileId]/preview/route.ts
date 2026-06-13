import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireSessionUserId } from "@/server/auth/session";
import { getStoredImageForUser } from "@/server/files/file-service";
import { withApiHandler } from "@/server/http/api-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    fileId: string;
  }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  return withApiHandler(async () => {
    const userId = await requireSessionUserId();
    const { fileId } = await context.params;
    const file = await getStoredImageForUser(userId, fileId, false);

    return new NextResponse(file.bytes, {
      headers: {
        "content-type": file.mimeType,
        "content-length": String(file.bytes.byteLength),
        "content-disposition": `inline; filename="${encodeURIComponent(file.originalName)}"`,
        "cache-control": "private, max-age=300",
        "x-content-type-options": "nosniff"
      }
    });
  });
}
