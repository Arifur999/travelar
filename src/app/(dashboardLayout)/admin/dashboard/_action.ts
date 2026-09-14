"use server";

import { getActionErrorMessage } from "@/lib/actionError";
import {
  addAdminTicketMessage,
  createAnnouncement,
  updateAnnouncement,
  updateTicketStatus,
} from "@/services/support.services";
import {
  assignPlan,
  createPlan,
  deactivatePlan,
  deleteAgency,
  extendTrial,
  updateAgencyStatus,
  updatePlan,
} from "@/services/admin.services";
import {
  assignPlanServerZodSchema,
  createPlanServerZodSchema,
  extendTrialServerZodSchema,
  updateAgencyStatusServerZodSchema,
  updatePlanServerZodSchema,
} from "@/zod/admin.validation";
import {
  addMessageServerZodSchema,
  createAnnouncementServerZodSchema,
  updateAnnouncementServerZodSchema,
  updateTicketStatusServerZodSchema,
} from "@/zod/support.validation";
import { type ApiErrorResponse, type ApiResponse } from "@/types/api.types";
import { type IAdminPlan } from "@/types/admin.types";
import { type IAnnouncement, type ISupportTicketDetail } from "@/types/support.types";

/** Every action here is SUPER_ADMIN on the API; the proxy keeps agencies out. */

/* --------------------------------- plans --------------------------------- */

export const createPlanAction = async (
  payload: unknown,
): Promise<ApiResponse<IAdminPlan> | ApiErrorResponse> => {
  const parsed = createPlanServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    return await createPlan(parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to create the plan") };
  }
};

export const updatePlanAction = async (
  id: string,
  payload: unknown,
): Promise<ApiResponse<IAdminPlan> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid plan id" };

  const parsed = updatePlanServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    // Changing a price does not re-bill anyone — existing subscriptions keep
    // the end date they were given.
    return await updatePlan(id, parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to update the plan") };
  }
};

export const deactivatePlanAction = async (
  id: string,
): Promise<ApiResponse<null> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid plan id" };

  try {
    // Deactivates rather than deletes, so agencies already on it keep working.
    return await deactivatePlan(id);
  } catch (error: unknown) {
    return {
      success: false,
      message: getActionErrorMessage(error, "Failed to deactivate the plan"),
    };
  }
};

/* -------------------------------- agencies ------------------------------- */

export const updateAgencyStatusAction = async (
  id: string,
  payload: unknown,
): Promise<ApiResponse<null> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid agency id" };

  const parsed = updateAgencyStatusServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    // Suspending is not cosmetic here: checkFeatureAccess reads the status, so
    // a suspended agency loses its modules as well as its write access.
    return await updateAgencyStatus(id, parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to update status") };
  }
};

export const assignPlanAction = async (
  id: string,
  payload: unknown,
): Promise<ApiResponse<null> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid agency id" };

  const parsed = assignPlanServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    return await assignPlan(id, parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to assign the plan") };
  }
};

export const extendTrialAction = async (
  id: string,
  payload: unknown,
): Promise<ApiResponse<null> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid agency id" };

  const parsed = extendTrialServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    return await extendTrial(id, parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to extend the trial") };
  }
};

export const deleteAgencyAction = async (
  id: string,
): Promise<ApiResponse<null> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid agency id" };

  try {
    // Soft-deletes AND deactivates the agency's users, so a deleted tenant
    // cannot keep working — which the old implementation allowed.
    return await deleteAgency(id);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to delete the agency") };
  }
};

/* --------------------------- support and notices -------------------------- */

export const replyToTicketAction = async (
  id: string,
  payload: unknown,
): Promise<ApiResponse<ISupportTicketDetail> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid ticket id" };

  const parsed = addMessageServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    // The operator can reply even on a closed thread — that is the one
    // asymmetry with the tenant side.
    return await addAdminTicketMessage(id, parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to send the reply") };
  }
};

export const updateTicketStatusAction = async (
  id: string,
  payload: unknown,
): Promise<ApiResponse<ISupportTicketDetail> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid ticket id" };

  const parsed = updateTicketStatusServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    return await updateTicketStatus(id, parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to update the status") };
  }
};

export const createAnnouncementAction = async (
  payload: unknown,
): Promise<ApiResponse<IAnnouncement> | ApiErrorResponse> => {
  const parsed = createAnnouncementServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    return await createAnnouncement(parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to publish") };
  }
};

export const updateAnnouncementAction = async (
  id: string,
  payload: unknown,
): Promise<ApiResponse<IAnnouncement> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid announcement id" };

  const parsed = updateAnnouncementServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    // Setting isActive false withdraws it — tenants only ever see live ones.
    return await updateAnnouncement(id, parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to update") };
  }
};
