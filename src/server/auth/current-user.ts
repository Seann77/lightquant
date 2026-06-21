import { getCurrentUserProfile } from "@/server/auth/auth-service";
import { getSessionUserId } from "@/server/auth/session";
import { ApiError } from "@/server/http/api-response";

export async function getOptionalCurrentUserProfile() {
  const userId = await getSessionUserId();

  if (!userId) {
    return null;
  }

  try {
    return await getCurrentUserProfile(userId);
  } catch (error) {
    if (isAuthProfileError(error)) {
      return null;
    }

    throw error;
  }
}

function isAuthProfileError(error: unknown) {
  return error instanceof ApiError && (
    error.code === "UNAUTHORIZED" ||
    error.code === "FORBIDDEN" ||
    error.code === "NOT_FOUND"
  );
}
