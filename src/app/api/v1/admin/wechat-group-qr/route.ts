import type { NextRequest } from "next/server";
import { getAdminWechatGroupQrCodes, uploadAdminWechatGroupQrCode } from "@/server/admin/wechat-group-qr-service";
import { ApiError, ok, withApiHandler } from "@/server/http/api-response";
import { getClientIp } from "@/server/http/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return withApiHandler(async (requestId) => ok(await getAdminWechatGroupQrCodes(), requestId));
}

export async function POST(request: NextRequest) {
  return withApiHandler(async (requestId) => {
    const formData = await request.formData();
    const file = formData.get("file");
    const expiresAt = formData.get("expiresAt");

    if (!(file instanceof File)) {
      throw new ApiError("VALIDATION_ERROR", "请上传微信群二维码图片", 400);
    }

    if (typeof expiresAt !== "string") {
      throw new ApiError("VALIDATION_ERROR", "请设置二维码到期时间", 400);
    }

    return ok(await uploadAdminWechatGroupQrCode({
      file,
      expiresAt,
      requestId,
      requestIp: getClientIp(request)
    }), requestId);
  });
}
