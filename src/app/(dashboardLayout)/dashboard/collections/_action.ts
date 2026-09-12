"use server";

import { getActionErrorMessage } from "@/lib/actionError";
import {
  createDueReceipt,
  deleteDueReceipt,
  updateDueReceipt,
} from "@/services/customer.services";
import {
  createDueReceiptServerZodSchema,
  updateDueReceiptServerZodSchema,
} from "@/zod/customer.validation";
import { type ApiErrorResponse, type ApiResponse } from "@/types/api.types";
import {
  type ICreateDueReceivedResponse,
  type IDueReceived,
} from "@/types/customer.types";

export const createDueReceiptAction = async (
  payload: unknown,
): Promise<ApiResponse<ICreateDueReceivedResponse> | ApiErrorResponse> => {
  const parsed = createDueReceiptServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  // The API enforces both of these too; checking here keeps a crafted request
  // from reaching it with a contradictory split.
  if (
    parsed.data.cashAccount2Id &&
    parsed.data.cashAccount2Id === parsed.data.cashAccount1Id
  ) {
    return { success: false, message: "The two accounts must be different" };
  }
  if (parsed.data.cashAccount2Id && !(parsed.data.amount2 && parsed.data.amount2 > 0)) {
    return { success: false, message: "A second account needs a second amount" };
  }
  if (parsed.data.amount2 && parsed.data.amount2 > 0 && !parsed.data.cashAccount2Id) {
    return { success: false, message: "A second amount needs a second account" };
  }

  try {
    return await createDueReceipt(parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to record collection") };
  }
};

/**
 * Date, notes and the discount only.
 *
 * The amounts and accounts have already posted to the ledger, so correcting
 * them means reversing the receipt. The discount is different: it posts to no
 * account and only moves what the customer owes, so it stays editable.
 */
export const updateDueReceiptAction = async (
  id: string,
  payload: unknown,
): Promise<ApiResponse<IDueReceived> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid receipt id" };

  const parsed = updateDueReceiptServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    return await updateDueReceipt(id, parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to update collection") };
  }
};

export const deleteDueReceiptAction = async (
  id: string,
): Promise<ApiResponse<null> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid receipt id" };

  try {
    // Reverses every posting the receipt wrote — both legs of a split tender.
    return await deleteDueReceipt(id);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to delete collection") };
  }
};
