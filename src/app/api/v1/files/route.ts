import type { NextRequest } from "next/server";
import { parseFileUploadPurpose } from "@/lib/file-upload-rules";
import { requireSessionUserId } from "@/server/auth/session";
import { uploadCodeFileForUser } from "@/server/files/file-service";
import { ApiError, ok, withApiHandler } from "@/server/http/api-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  return withApiHandler(async (requestId) => {
    const userId = await requireSessionUserId();
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      throw new ApiError("VALIDATION_ERROR", "请上传文件", 400);
    }

    const purpose = parseFileUploadPurpose(formData.get("purpose"));

    if (!purpose) {
      throw new ApiError("VALIDATION_ERROR", "请提供正确的上传业务类型", 400);
    }

    const data = await uploadCodeFileForUser(userId, file, purpose);

    return ok(data, requestId);
  });
}
