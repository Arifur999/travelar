"use server";

import { getActionErrorMessage } from "@/lib/actionError";
import { updateAgencyProfile } from "@/services/team.services";
import { updateAgencyProfileServerZodSchema } from "@/zod/team.validation";
import { type ApiErrorResponse, type ApiResponse } from "@/types/api.types";
import { type IAgencyProfile } from "@/types/team.types";

export const updateAgencyProfileAction = async (
  payload: unknown,
): Promise<ApiResponse<IAgencyProfile> | ApiErrorResponse> => {
  const parsed = updateAgencyProfileServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    return await updateAgencyProfile(parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to save the profile") };
  }
};
