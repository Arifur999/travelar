"use server";

import { getActionErrorMessage } from "@/lib/actionError";
import {
  createBalanceTransfer,
  deleteBalanceTransfer,
  updateBalanceTransfer,
} from "@/services/account.services";
import {
  createBalanceTransferServerZodSchema,
  updateBalanceTransferServerZodSchema,
} from "@/zod/account.validation";
import { type ApiErrorResponse, type ApiResponse } from "@/types/api.types";
import { type IBalanceTransfer } from "@/types/account.types";

export const createBalanceTransferAction = async (
  payload: unknown,
): Promise<ApiResponse<IBalanceTransfer> | ApiErrorResponse> => {
  const parsed = createBalanceTransferServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    // The API also refuses a transfer that would overdraw the source account,
    // and that message names the available balance — worth showing as-is.
    return await createBalanceTransfer(parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to record transfer") };
  }
};

/**
 * Only the date and note are editable. Amount and the two accounts have
 * already moved balances, so changing them would need the old postings
 * reversed — the API rejects them for that reason, and this schema drops them
 * before they ever get there.
 */
export const updateBalanceTransferAction = async (
  id: string,
  payload: unknown,
): Promise<ApiResponse<IBalanceTransfer> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid transfer id" };

  const parsed = updateBalanceTransferServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    return await updateBalanceTransfer(id, parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to update transfer") };
  }
};

export const deleteBalanceTransferAction = async (
  id: string,
): Promise<ApiResponse<null> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid transfer id" };

  try {
    // Deleting reverses both postings, so the two balances return to exactly
    // what they were before the transfer.
    return await deleteBalanceTransfer(id);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to delete transfer") };
  }
};
