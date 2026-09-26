"use server";

import { getActionErrorMessage } from "@/lib/actionError";
import {
  reviewManualPayment,
  updatePaymentSettings,
  uploadPaymentQr,
} from "@/services/admin.services";
import { type ApiErrorResponse, type ApiResponse } from "@/types/api.types";
import { type IPaymentSettings } from "@/types/billing.types";

/**
 * Where subscription money is sent, and what to do with the claims against it.
 *
 * All three are SUPER_ADMIN on the API. Approving a claim renews a plan, so
 * the check that matters is not here — it is on the route — but it is worth
 * saying why this file exists at all: nothing an agency can reach lives in it.
 */
export const updatePaymentSettingsAction = async (
  bkashNumber: string,
): Promise<ApiResponse<IPaymentSettings> | ApiErrorResponse> => {
  try {
    return await updatePaymentSettings({ bkashNumber });
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Could not save the number") };
  }
};

export const uploadPaymentQrAction = async (
  formData: FormData,
): Promise<ApiResponse<IPaymentSettings> | ApiErrorResponse> => {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, message: "Choose the QR image to upload" };
  }

  try {
    return await uploadPaymentQr(formData);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Could not save the QR") };
  }
};

export const reviewManualPaymentAction = async (
  id: string,
  approve: boolean,
  note?: string,
): Promise<ApiResponse<{ id: string; approved: boolean }> | ApiErrorResponse> => {
  try {
    return await reviewManualPayment(id, { approve, note });
  } catch (error: unknown) {
    return {
      success: false,
      message: getActionErrorMessage(error, "Could not record that decision"),
    };
  }
};
