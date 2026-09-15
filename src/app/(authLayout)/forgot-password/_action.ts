"use server";

import { getActionErrorMessage } from "@/lib/actionError";
import { requestPasswordReset } from "@/services/auth.services";
import { forgotPasswordServerZodSchema } from "@/zod/auth.validation";
import { type ApiErrorResponse, type ApiResponse } from "@/types/api.types";

export const forgotPasswordAction = async (
  payload: unknown,
): Promise<ApiResponse<null> | ApiErrorResponse> => {
  const parsed = forgotPasswordServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    // The API answers identically whether or not the address has an account;
    // this passes that answer through untouched rather than adding a hint.
    return await requestPasswordReset(parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Could not send a reset link") };
  }
};
