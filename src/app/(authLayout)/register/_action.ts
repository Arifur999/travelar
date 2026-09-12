"use server";

import { getActionErrorMessage } from "@/lib/actionError";
import { registerAgency } from "@/services/auth.services";
import { registerServerZodSchema } from "@/zod/auth.validation";
import { type ApiErrorResponse, type ApiResponse } from "@/types/api.types";
import { type IRegisterResponse } from "@/types/user.types";

/**
 * Registration creates the agency and its first admin, and signs them straight
 * in — the API issues a session alongside the tenant, so there is no second
 * trip through /login.
 */
export const registerAction = async (
  payload: unknown,
): Promise<ApiResponse<IRegisterResponse> | ApiErrorResponse> => {
  const parsed = registerServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    return await registerAgency(parsed.data);
  } catch (error: unknown) {
    return {
      success: false,
      message: getActionErrorMessage(error, "Failed to complete registration"),
    };
  }
};
