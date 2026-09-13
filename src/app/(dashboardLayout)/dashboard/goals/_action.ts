"use server";

import { getActionErrorMessage } from "@/lib/actionError";
import { upsertGoal } from "@/services/dashboard.services";
import { upsertGoalServerZodSchema } from "@/zod/dashboard.validation";
import { type ApiErrorResponse, type ApiResponse } from "@/types/api.types";
import { type IMonthlyGoal } from "@/types/dashboard.types";

/**
 * AGENCY_ADMIN only on the API — staff can read goals but not set them.
 *
 * This is an upsert keyed on (agency, year, month): saving the same month twice
 * updates it rather than creating a duplicate.
 */
export const upsertGoalAction = async (
  payload: unknown,
): Promise<ApiResponse<IMonthlyGoal> | ApiErrorResponse> => {
  const parsed = upsertGoalServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    return await upsertGoal(parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to save the goal") };
  }
};
