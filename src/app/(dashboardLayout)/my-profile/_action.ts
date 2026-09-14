"use server";

import { getActionErrorMessage } from "@/lib/actionError";
import { updateMyProfile } from "@/services/team.services";
import { updateMyProfileServerZodSchema } from "@/zod/team.validation";
import { type ApiErrorResponse, type ApiResponse } from "@/types/api.types";
import { type IUser } from "@/types/user.types";

export const updateMyProfileAction = async (
  payload: unknown,
): Promise<ApiResponse<IUser> | ApiErrorResponse> => {
  const parsed = updateMyProfileServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    return await updateMyProfile(parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to update your name") };
  }
};
