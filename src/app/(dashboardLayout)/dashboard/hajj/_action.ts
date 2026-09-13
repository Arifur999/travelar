"use server";

import { getActionErrorMessage } from "@/lib/actionError";
import {
  assignHajjRoom,
  changeHajjBookingStatus,
  createHajjBatch,
  createHajjBooking,
  createHajjPackage,
  createHajjRoom,
  deleteHajjBatch,
  deleteHajjBooking,
  deleteHajjPackage,
  deleteHajjPayment,
  deleteHajjRoom,
  recordHajjPayment,
  setHajjDocumentStatus,
  updateHajjBatch,
  updateHajjPackage,
} from "@/services/hajj.services";
import {
  assignRoomServerZodSchema,
  changeHajjStatusServerZodSchema,
  createHajjBatchServerZodSchema,
  createHajjBookingServerZodSchema,
  createHajjPackageServerZodSchema,
  createHajjRoomServerZodSchema,
  hajjPaymentServerZodSchema,
  updateHajjBatchServerZodSchema,
  updateHajjPackageServerZodSchema,
} from "@/zod/hajj.validation";
import { type ApiErrorResponse, type ApiResponse } from "@/types/api.types";
import { type DocumentStatus } from "@/types/enums.types";
import {
  type IHajjBatch,
  type IHajjBooking,
  type IHajjBookingDetail,
  type IHajjPackage,
  type IHajjRoom,
} from "@/types/hajj.types";

/* -------------------------------- packages ------------------------------- */

export const createHajjPackageAction = async (
  payload: unknown,
): Promise<ApiResponse<IHajjPackage> | ApiErrorResponse> => {
  const parsed = createHajjPackageServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    return await createHajjPackage(parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to create package") };
  }
};

export const updateHajjPackageAction = async (
  id: string,
  payload: unknown,
): Promise<ApiResponse<IHajjPackage> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid package id" };

  const parsed = updateHajjPackageServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    // Changing the price does not move any existing booking: each one
    // snapshotted its own price at booking time.
    return await updateHajjPackage(id, parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to update package") };
  }
};

export const deleteHajjPackageAction = async (
  id: string,
): Promise<ApiResponse<null> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid package id" };

  try {
    // Refused while batches or bookings still reference it. The old code did
    // not check, and silently orphaned both.
    return await deleteHajjPackage(id);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to delete package") };
  }
};

/* -------------------------------- batches -------------------------------- */

export const createHajjBatchAction = async (
  payload: unknown,
): Promise<ApiResponse<IHajjBatch> | ApiErrorResponse> => {
  const parsed = createHajjBatchServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    return await createHajjBatch(parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to create batch") };
  }
};

export const updateHajjBatchAction = async (
  id: string,
  payload: unknown,
): Promise<ApiResponse<IHajjBatch> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid batch id" };

  const parsed = updateHajjBatchServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    return await updateHajjBatch(id, parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to update batch") };
  }
};

export const deleteHajjBatchAction = async (
  id: string,
): Promise<ApiResponse<null> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid batch id" };

  try {
    return await deleteHajjBatch(id);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to delete batch") };
  }
};

/* --------------------------------- rooms --------------------------------- */

export const createHajjRoomAction = async (
  payload: unknown,
): Promise<ApiResponse<IHajjRoom> | ApiErrorResponse> => {
  const parsed = createHajjRoomServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    return await createHajjRoom(parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to create room") };
  }
};

export const deleteHajjRoomAction = async (
  id: string,
): Promise<ApiResponse<null> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid room id" };

  try {
    return await deleteHajjRoom(id);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to delete room") };
  }
};

/* -------------------------------- bookings ------------------------------- */

export const createHajjBookingAction = async (
  payload: unknown,
): Promise<ApiResponse<IHajjBooking> | ApiErrorResponse> => {
  const parsed = createHajjBookingServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    // The API refuses a booking once the batch is full — seats are counted from
    // live bookings, so a cancelled pilgrim's bed is already free again.
    return await createHajjBooking(parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to create booking") };
  }
};

export const changeHajjBookingStatusAction = async (
  id: string,
  payload: unknown,
): Promise<ApiResponse<IHajjBookingDetail> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid booking id" };

  const parsed = changeHajjStatusServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    // Cancelling releases the seat and both room assignments.
    return await changeHajjBookingStatus(id, parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to change status") };
  }
};

/** `roomId: null` clears the assignment and frees the bed. */
export const assignHajjRoomAction = async (
  id: string,
  payload: unknown,
): Promise<ApiResponse<IHajjBookingDetail> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid booking id" };

  const parsed = assignRoomServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    // The API refuses a room that is already at capacity.
    return await assignHajjRoom(id, parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to assign room") };
  }
};

export const setHajjDocumentStatusAction = async (
  id: string,
  documentId: string,
  documentStatus: DocumentStatus,
): Promise<ApiResponse<IHajjBookingDetail> | ApiErrorResponse> => {
  if (!id || !documentId) return { success: false, message: "Invalid document" };

  try {
    return await setHajjDocumentStatus(id, documentId, documentStatus);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to update document") };
  }
};

export const recordHajjPaymentAction = async (
  id: string,
  payload: unknown,
): Promise<ApiResponse<IHajjBookingDetail> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid booking id" };

  const parsed = hajjPaymentServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    // Invoice-level, so capped at the outstanding due.
    return await recordHajjPayment(id, parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to record payment") };
  }
};

/** AGENCY_ADMIN only on the API. */
export const deleteHajjPaymentAction = async (
  id: string,
  paymentId: string,
): Promise<ApiResponse<IHajjBookingDetail> | ApiErrorResponse> => {
  if (!id || !paymentId) return { success: false, message: "Invalid payment" };

  try {
    return await deleteHajjPayment(id, paymentId);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to delete payment") };
  }
};

/** AGENCY_ADMIN only on the API. */
export const deleteHajjBookingAction = async (
  id: string,
): Promise<ApiResponse<null> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid booking id" };

  try {
    return await deleteHajjBooking(id);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to delete booking") };
  }
};
