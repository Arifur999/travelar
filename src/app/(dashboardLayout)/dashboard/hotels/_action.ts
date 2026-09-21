"use server";

import { getActionErrorMessage } from "@/lib/actionError";
import {
  changeHotelBookingStatus,
  createHotelBooking,
  deleteHotelBooking,
  deleteHotelPayment,
  recordHotelPayment,
  updateHotelBooking,
} from "@/services/hotel.services";
import {
  changeHotelStatusServerZodSchema,
  createHotelBookingServerZodSchema,
  hotelPaymentServerZodSchema,
  updateHotelBookingServerZodSchema,
} from "@/zod/hotel.validation";
import { type ApiErrorResponse, type ApiResponse } from "@/types/api.types";
import { type IHotelBooking, type IHotelBookingDetail } from "@/types/hotel.types";

export const createHotelBookingAction = async (
  payload: unknown,
): Promise<ApiResponse<IHotelBooking> | ApiErrorResponse> => {
  const parsed = createHotelBookingServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    // "Check-out cannot be before check-in" comes from the API, which compares
    // the parsed dates — it is the authority on them.
    return await createHotelBooking(parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to create booking") };
  }
};

export const updateHotelBookingAction = async (
  id: string,
  payload: unknown,
): Promise<ApiResponse<IHotelBookingDetail> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid booking id" };

  const parsed = updateHotelBookingServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    // Moving the dates recounts the nights; cutting the price below what has
    // been paid is refused, and the API names the figure.
    return await updateHotelBooking(id, parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to update booking") };
  }
};

export const changeHotelBookingStatusAction = async (
  id: string,
  payload: unknown,
): Promise<ApiResponse<IHotelBookingDetail> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid booking id" };

  const parsed = changeHotelStatusServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    return await changeHotelBookingStatus(id, parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to change status") };
  }
};

export const recordHotelPaymentAction = async (
  id: string,
  payload: unknown,
): Promise<ApiResponse<IHotelBookingDetail> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid booking id" };

  const parsed = hotelPaymentServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    // Capped at the outstanding due inside a transaction, and the message
    // names the figure — surfaced verbatim.
    return await recordHotelPayment(id, parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to record payment") };
  }
};

/** AGENCY_ADMIN only on the API. */
export const deleteHotelPaymentAction = async (
  id: string,
  paymentId: string,
): Promise<ApiResponse<IHotelBookingDetail> | ApiErrorResponse> => {
  if (!id || !paymentId) return { success: false, message: "Invalid payment" };

  try {
    return await deleteHotelPayment(id, paymentId);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to reverse payment") };
  }
};

/** AGENCY_ADMIN only on the API. */
export const deleteHotelBookingAction = async (
  id: string,
): Promise<ApiResponse<null> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid booking id" };

  try {
    return await deleteHotelBooking(id);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to delete booking") };
  }
};
