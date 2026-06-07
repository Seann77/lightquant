import type { User } from "@/server/domain";
import { getAdminPhoneWhitelist } from "@/server/env";
import { getSessionUserId } from "@/server/auth/session";
import { ApiError } from "@/server/http/api-response";
import { getRepository } from "@/server/repositories";

export type AdminContext = {
  user: User;
};

export async function requireAdmin(): Promise<AdminContext> {
  const userId = await getSessionUserId();

  if (!userId) {
    throw new ApiError("UNAUTHORIZED", "请先登录", 401);
  }

  const user = await getRepository().findUserById(userId);

  if (!user || user.status !== "active") {
    throw new ApiError("UNAUTHORIZED", "请先登录", 401);
  }

  const whitelist = getAdminPhoneWhitelist();

  if (whitelist.length === 0 || !whitelist.includes(user.phone)) {
    throw new ApiError("NOT_FOUND", "资源不存在", 404);
  }

  return {
    user
  };
}

export async function getOptionalAdminForPage() {
  try {
    return await requireAdmin();
  } catch (error) {
    if (error instanceof ApiError && error.code === "UNAUTHORIZED") {
      return null;
    }

    throw error;
  }
}
