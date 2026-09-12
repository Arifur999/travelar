"use server";

import { getActionErrorMessage } from "@/lib/actionError";
import {
  createCashAccount,
  deleteCashAccount,
  updateCashAccount,
} from "@/services/account.services";
import {
  createCashAccountServerZodSchema,
  updateCashAccountServerZodSchema,
} from "@/zod/account.validation";
import { type ApiErrorResponse, type ApiResponse } from "@/types/api.types";
import { type IAccountBalance } from "@/types/account.types";

export const createCashAccountAction = async (
  payload: unknown,
): Promise<ApiResponse<IAccountBalance> | ApiErrorResponse> => {
  const parsed = createCashAccountServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    return await createCashAccount(parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to create account") };
  }
};

/**
 * Uses its own schema rather than `createCashAccountServerZodSchema.partial()`:
 * the update schema has no `openingBalance` at all, so a client that posts one
 * has it stripped here rather than forwarded to an API that would reject it.
 */
export const updateCashAccountAction = async (
  id: string,
  payload: unknown,
): Promise<ApiResponse<IAccountBalance> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid account id" };

  const parsed = updateCashAccountServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    return await updateCashAccount(id, parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to update account") };
  }
};

export const deleteCashAccountAction = async (
  id: string,
): Promise<ApiResponse<null> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid account id" };

  try {
    // The API refuses this when the account carries postings or a non-zero
    // balance; that message names the reason, so it is surfaced verbatim.
    return await deleteCashAccount(id);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to delete account") };
  }
};
