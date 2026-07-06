import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getPublicWechatGroupQrImage } from "@/server/admin/wechat-group-qr-service";
import { withApiHandler } from "@/server/http/api-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  return withApiHandler(async () => {
    const { id } = await context.params;
    const image = await getPublicWechatGroupQrImage(id);

    return new NextResponse(new Uint8Array(image.bytes), {
      headers: {
        "content-type": image.mimeType,
        "content-length": String(image.sizeBytes),
        "cache-control": "public, max-age=31536000, immutable",
        "x-content-type-options": "nosniff"
      }
    });
  });
}
