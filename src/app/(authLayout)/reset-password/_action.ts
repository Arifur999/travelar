"use server";

import { getActionErrorMessage } from "@/lib/actionError";
import { resetPassword } from "@/services/auth.services";
import { resetPasswordServerZodSchema } from "@/zod/auth.validation";
import { type ApiErrorResponse, type ApiResponse } from "@/types/api.types";

export const resetPasswordAction = async (
  payload: unknown,
): Promise<ApiResponse<null> | ApiErrorResponse> => {
  const parsed = resetPasswordServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    // No cookies are set: the API signs the account out everywhere on reset,
    // and the user signs in again with the new password.
    return await resetPassword(parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Could not reset your password") };
  }
};
