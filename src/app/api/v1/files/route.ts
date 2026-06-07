import type { NextRequest } from "next/server";
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

    const data = await uploadCodeFileForUser(userId, file);

    return ok(data, requestId);
  });
}
