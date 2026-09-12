"use server";

import { getActionErrorMessage } from "@/lib/actionError";
import {
  createSupplierTransaction,
  deleteSupplierTransaction,
  updateSupplierTransaction,
} from "@/services/supplier.services";
import {
  createSupplierPaymentServerZodSchema,
  updateSupplierPaymentServerZodSchema,
} from "@/zod/supplier.validation";
import { type ApiErrorResponse, type ApiResponse } from "@/types/api.types";
import {
  type ICreateSupplierTransactionResponse,
  type ISupplierTransaction,
} from "@/types/supplier.types";

export const createSupplierPaymentAction = async (
  payload: unknown,
): Promise<ApiResponse<ICreateSupplierTransactionResponse> | ApiErrorResponse> => {
  const parsed = createSupplierPaymentServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    return await createSupplierTransaction(parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to record payment") };
  }
};

/**
 * Date and note only. The amount and the account have already moved a balance,
 * so correcting either means reversing the posting — which is what delete
 * does. The API rejects them for the same reason.
 */
export const updateSupplierPaymentAction = async (
  id: string,
  payload: unknown,
): Promise<ApiResponse<ISupplierTransaction> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid payment id" };

  const parsed = updateSupplierPaymentServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    return await updateSupplierTransaction(id, parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to update payment") };
  }
};

/**
 * AGENCY_ADMIN only on the API. Staff get a 403 with the reason, which is
 * surfaced verbatim rather than replaced with a generic failure — the button is
 * hidden for staff, but the action still has to hold the line.
 */
export const deleteSupplierPaymentAction = async (
  id: string,
): Promise<ApiResponse<null> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid payment id" };

  try {
    return await deleteSupplierTransaction(id);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to delete payment") };
  }
};
