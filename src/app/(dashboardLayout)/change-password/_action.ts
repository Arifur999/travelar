"use server";

import { getActionErrorMessage } from "@/lib/actionError";
import { changePassword, clearAuthCookies } from "@/services/auth.services";
import { changePasswordServerZodSchema } from "@/zod/auth.validation";
import { type ApiErrorResponse, type ApiResponse } from "@/types/api.types";

export const changePasswordAction = async (
  payload: unknown,
): Promise<ApiResponse<{ message: string }> | ApiErrorResponse> => {
  const parsed = changePasswordServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  if (parsed.data.currentPassword === parsed.data.newPassword) {
    return { success: false, message: "The new password must be different from the current one" };
  }

  try {
    const result = await changePassword(parsed.data);

    // The API revokes every other session on success, and better-auth rotates
    // the session token — the cookies held here are stale the moment this
    // returns. Clearing them forces a clean sign-in rather than leaving the
    // user holding credentials the server no longer honours.
    await clearAuthCookies();

    return result;
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to change password") };
  }
};
