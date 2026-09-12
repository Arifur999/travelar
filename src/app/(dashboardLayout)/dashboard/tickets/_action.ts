"use server";

import { getActionErrorMessage } from "@/lib/actionError";
import {
  changeTicketStatus,
  createTicket,
  deleteTicket,
  deleteTicketPayment,
  recordDateChange,
  recordTicketPayment,
  updateTicket,
} from "@/services/ticket.services";
import {
  changeStatusServerZodSchema,
  createTicketServerZodSchema,
  dateChangeServerZodSchema,
  ticketPaymentServerZodSchema,
  updateTicketServerZodSchema,
} from "@/zod/ticket.validation";
import { type ApiErrorResponse, type ApiResponse } from "@/types/api.types";
import { type ITicket, type ITicketDetail } from "@/types/ticket.types";

export const createTicketAction = async (
  payload: unknown,
): Promise<ApiResponse<ITicket> | ApiErrorResponse> => {
  const parsed = createTicketServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    // The API also checks that the customer, supplier, airline and route all
    // belong to this agency — a cross-tenant id is rejected there.
    return await createTicket(parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to create ticket") };
  }
};

export const updateTicketAction = async (
  id: string,
  payload: unknown,
): Promise<ApiResponse<ITicketDetail> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid ticket id" };

  const parsed = updateTicketServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    return await updateTicket(id, parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to update ticket") };
  }
};

/**
 * Additive on both sides — the fee raises what the customer is charged and the
 * cost raises what the supplier is owed. Refused on a refunded or void ticket.
 */
export const recordDateChangeAction = async (
  id: string,
  payload: unknown,
): Promise<ApiResponse<ITicketDetail> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid ticket id" };

  const parsed = dateChangeServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    return await recordDateChange(id, parsed.data);
  } catch (error: unknown) {
    return {
      success: false,
      message: getActionErrorMessage(error, "Failed to record the date change"),
    };
  }
};

export const changeTicketStatusAction = async (
  id: string,
  payload: unknown,
): Promise<ApiResponse<ITicketDetail> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid ticket id" };

  const parsed = changeStatusServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    // The API enforces the one-way transition table, so an illegal move is
    // refused there with the reason rather than silently applied.
    return await changeTicketStatus(id, parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to change status") };
  }
};

export const recordTicketPaymentAction = async (
  id: string,
  payload: unknown,
): Promise<ApiResponse<ITicketDetail> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid ticket id" };

  const parsed = ticketPaymentServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    // Unlike a ledger-level collection, this IS capped at the outstanding due —
    // the API checks it inside a transaction and names the figure, so the
    // message is worth surfacing verbatim.
    return await recordTicketPayment(id, parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to record payment") };
  }
};

/** AGENCY_ADMIN only on the API. */
export const deleteTicketPaymentAction = async (
  id: string,
  paymentId: string,
): Promise<ApiResponse<ITicketDetail> | ApiErrorResponse> => {
  if (!id || !paymentId) return { success: false, message: "Invalid payment" };

  try {
    return await deleteTicketPayment(id, paymentId);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to delete payment") };
  }
};

/** AGENCY_ADMIN only on the API. */
export const deleteTicketAction = async (
  id: string,
): Promise<ApiResponse<null> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid ticket id" };

  try {
    return await deleteTicket(id);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to delete ticket") };
  }
};
