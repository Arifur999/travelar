"use server";

import { getActionErrorMessage } from "@/lib/actionError";
import {
  changeTourBookingStatus,
  createTour,
  createTourBooking,
  deleteTour,
  deleteTourBooking,
  deleteTourPayment,
  recordTourPayment,
  updateTour,
  updateTourBooking,
} from "@/services/tour.services";
import {
  changeTourStatusServerZodSchema,
  createTourBookingServerZodSchema,
  createTourServerZodSchema,
  tourPaymentServerZodSchema,
  updateTourBookingServerZodSchema,
  updateTourServerZodSchema,
} from "@/zod/tour.validation";
import { type ApiErrorResponse, type ApiResponse } from "@/types/api.types";
import {
  type ITourBooking,
  type ITourBookingDetail,
  type ITourPackage,
  type ITourPackageDetail,
} from "@/types/tour.types";

/* --------------------------------- tours --------------------------------- */

export const createTourAction = async (
  payload: unknown,
): Promise<ApiResponse<ITourPackage> | ApiErrorResponse> => {
  const parsed = createTourServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    return await createTour(parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to create tour") };
  }
};

export const updateTourAction = async (
  id: string,
  payload: unknown,
): Promise<ApiResponse<ITourPackageDetail> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid tour id" };

  const parsed = updateTourServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    // Repricing moves no existing booking: each one snapshotted its own price.
    // Cutting the seats below what is sold is refused by the API, which names
    // the figure, so that message is worth surfacing verbatim.
    return await updateTour(id, parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to update tour") };
  }
};

/** AGENCY_ADMIN only, and refused while the tour has bookings. */
export const deleteTourAction = async (
  id: string,
): Promise<ApiResponse<null> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid tour id" };

  try {
    return await deleteTour(id);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to delete tour") };
  }
};

/* -------------------------------- bookings ------------------------------- */

export const createTourBookingAction = async (
  payload: unknown,
): Promise<ApiResponse<ITourBooking> | ApiErrorResponse> => {
  const parsed = createTourBookingServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    // "Only N seats are left" comes from the API, which counts them inside a
    // transaction — it is more accurate than anything checked here.
    return await createTourBooking(parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to create booking") };
  }
};

export const updateTourBookingAction = async (
  id: string,
  payload: unknown,
): Promise<ApiResponse<ITourBookingDetail> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid booking id" };

  const parsed = updateTourBookingServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    return await updateTourBooking(id, parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to update booking") };
  }
};

export const changeTourBookingStatusAction = async (
  id: string,
  payload: unknown,
): Promise<ApiResponse<ITourBookingDetail> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid booking id" };

  const parsed = changeTourStatusServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    // The lifecycle is one-way and the API is the authority on it; a refused
    // transition names both statuses, which is what the user needs to read.
    return await changeTourBookingStatus(id, parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to change status") };
  }
};

export const recordTourPaymentAction = async (
  id: string,
  payload: unknown,
): Promise<ApiResponse<ITourBookingDetail> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid booking id" };

  const parsed = tourPaymentServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    // Capped at the outstanding due inside a transaction, and the message
    // names the figure — surfaced verbatim.
    return await recordTourPayment(id, parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to record payment") };
  }
};

/** AGENCY_ADMIN only on the API. */
export const deleteTourPaymentAction = async (
  id: string,
  paymentId: string,
): Promise<ApiResponse<ITourBookingDetail> | ApiErrorResponse> => {
  if (!id || !paymentId) return { success: false, message: "Invalid payment" };

  try {
    return await deleteTourPayment(id, paymentId);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to reverse payment") };
  }
};

/** AGENCY_ADMIN only on the API. */
export const deleteTourBookingAction = async (
  id: string,
): Promise<ApiResponse<null> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid booking id" };

  try {
    return await deleteTourBooking(id);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to delete booking") };
  }
};
