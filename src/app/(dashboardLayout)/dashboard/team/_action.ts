"use server";

import { getActionErrorMessage } from "@/lib/actionError";
import {
  createTeamMember,
  removeTeamMember,
  resetTeamMemberPassword,
  updateTeamMember,
  updateTeamMemberStatus,
} from "@/services/team.services";
import {
  createTeamMemberServerZodSchema,
  resetTeamMemberPasswordServerZodSchema,
  updateTeamMemberServerZodSchema,
  updateTeamMemberStatusServerZodSchema,
} from "@/zod/team.validation";
import { type ApiErrorResponse, type ApiResponse } from "@/types/api.types";
import { type ITeamMember } from "@/types/team.types";

/**
 * Who may act on whom is decided by the API (owner / admin / self rules in
 * TeamService.assertCanManage). The UI mirrors those rules to hide what would
 * be refused, but its 403 message is still passed through verbatim — it says
 * exactly why, which a generic failure would not.
 */

export const createTeamMemberAction = async (
  payload: unknown,
): Promise<ApiResponse<ITeamMember> | ApiErrorResponse> => {
  const parsed = createTeamMemberServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    return await createTeamMember(parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to add the member") };
  }
};

export const updateTeamMemberAction = async (
  id: string,
  payload: unknown,
): Promise<ApiResponse<ITeamMember> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid member id" };

  const parsed = updateTeamMemberServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    // A role change signs the member out on the API, so their next login
    // carries the new role.
    return await updateTeamMember(id, parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to update the member") };
  }
};

export const updateTeamMemberStatusAction = async (
  id: string,
  payload: unknown,
): Promise<ApiResponse<ITeamMember> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid member id" };

  const parsed = updateTeamMemberStatusServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    return await updateTeamMemberStatus(id, parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to change the status") };
  }
};

export const resetTeamMemberPasswordAction = async (
  id: string,
  payload: unknown,
): Promise<ApiResponse<null> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid member id" };

  const parsed = resetTeamMemberPasswordServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    return await resetTeamMemberPassword(id, parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to reset the password") };
  }
};

export const removeTeamMemberAction = async (
  id: string,
): Promise<ApiResponse<null> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid member id" };

  try {
    return await removeTeamMember(id);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to remove the member") };
  }
};
