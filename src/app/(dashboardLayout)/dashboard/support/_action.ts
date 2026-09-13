"use server";

import { getActionErrorMessage } from "@/lib/actionError";
import {
  addTicketMessage,
  createSupportTicket,
  markAnnouncementRead,
} from "@/services/support.services";
import {
  addMessageServerZodSchema,
  createSupportTicketServerZodSchema,
} from "@/zod/support.validation";
import { type ApiErrorResponse, type ApiResponse } from "@/types/api.types";
import { type ISupportTicket, type ISupportTicketDetail } from "@/types/support.types";

export const createSupportTicketAction = async (
  payload: unknown,
): Promise<ApiResponse<ISupportTicket> | ApiErrorResponse> => {
  const parsed = createSupportTicketServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    // The ticket and its first message are written together on the API, so a
    // failure between them cannot leave a thread with nothing in it.
    return await createSupportTicket(parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to open the ticket") };
  }
};

export const addTicketMessageAction = async (
  id: string,
  payload: unknown,
): Promise<ApiResponse<ISupportTicketDetail> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid ticket id" };

  const parsed = addMessageServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    // A closed thread stops taking replies from the agency; the operator can
    // still add a closing note. The API says which, so the message is shown.
    return await addTicketMessage(id, parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to send the message") };
  }
};

export const markAnnouncementReadAction = async (
  id: string,
): Promise<ApiResponse<null> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid announcement id" };

  try {
    // An upsert on the API, so marking twice is harmless — and only a live
    // announcement can be marked, unlike the old code which took any id.
    return await markAnnouncementRead(id);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to mark as read") };
  }
};
