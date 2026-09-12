"use server";

import { getActionErrorMessage } from "@/lib/actionError";
import { loginUser } from "@/services/auth.services";
import { loginServerZodSchema } from "@/zod/auth.validation";
import { type ApiErrorResponse, type ApiResponse } from "@/types/api.types";
import { type ILoginResponse } from "@/types/user.types";

/**
 * Never throws — the form just checks `result.success`.
 *
 * No redirect happens here. `loginUser` writes the auth cookies, and the
 * component navigates afterwards, so it can honour a validated `?redirect=`
 * target instead of always landing on the default dashboard.
 */
export const loginAction = async (
  payload: unknown,
): Promise<ApiResponse<ILoginResponse> | ApiErrorResponse> => {
  // Re-validate on the server — the client schema only guards the UI.
  const parsed = loginServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    return await loginUser(parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to sign you in") };
  }
};
