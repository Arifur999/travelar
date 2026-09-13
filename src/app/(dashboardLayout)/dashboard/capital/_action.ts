"use server";

import { getActionErrorMessage } from "@/lib/actionError";
import {
  createCapitalFlow,
  createProfitWithdrawal,
  deleteCapitalFlow,
  deleteProfitWithdrawal,
  updateCapitalFlow,
  updateProfitWithdrawal,
} from "@/services/capital.services";
import {
  createCapitalFlowServerZodSchema,
  createProfitWithdrawalServerZodSchema,
  updateDateNoteServerZodSchema,
} from "@/zod/capital.validation";
import { type ApiErrorResponse, type ApiResponse } from "@/types/api.types";
import { type ICapitalFlow, type IProfitWithdrawal } from "@/types/capital.types";

/**
 * Every capital route is AGENCY_ADMIN on the API. These actions do not
 * re-check the role — the API is the authority and returns a 403 with the
 * reason — but the nav entry and page are restricted so staff never get here.
 */

/* ------------------------------ capital flows ---------------------------- */

export const createCapitalFlowAction = async (
  payload: unknown,
): Promise<ApiResponse<ICapitalFlow> | ApiErrorResponse> => {
  const parsed = createCapitalFlowServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    // NOT guarded against overdrawing, and that is deliberate on the API side:
    // assertSufficientBalance is applied only to transfers between the
    // agency's own accounts, because expenses, payouts and withdrawals are
    // allowed to go negative "matching how the agency already works on paper".
    // Verified: a 900,000 withdrawal against a 619,000 balance is accepted and
    // takes the account negative. The form warns rather than blocking.
    return await createCapitalFlow(parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to record entry") };
  }
};

export const updateCapitalFlowAction = async (
  id: string,
  payload: unknown,
): Promise<ApiResponse<ICapitalFlow> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid entry id" };

  const parsed = updateDateNoteServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    return await updateCapitalFlow(id, parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to update entry") };
  }
};

export const deleteCapitalFlowAction = async (
  id: string,
): Promise<ApiResponse<null> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid entry id" };

  try {
    return await deleteCapitalFlow(id);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to delete entry") };
  }
};

/* --------------------------- profit withdrawals -------------------------- */

export const createProfitWithdrawalAction = async (
  payload: unknown,
): Promise<ApiResponse<IProfitWithdrawal> | ApiErrorResponse> => {
  const parsed = createProfitWithdrawalServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    return await createProfitWithdrawal(parsed.data);
  } catch (error: unknown) {
    return {
      success: false,
      message: getActionErrorMessage(error, "Failed to record withdrawal"),
    };
  }
};

export const updateProfitWithdrawalAction = async (
  id: string,
  payload: unknown,
): Promise<ApiResponse<IProfitWithdrawal> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid withdrawal id" };

  const parsed = updateDateNoteServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    return await updateProfitWithdrawal(id, parsed.data);
  } catch (error: unknown) {
    return {
      success: false,
      message: getActionErrorMessage(error, "Failed to update withdrawal"),
    };
  }
};

export const deleteProfitWithdrawalAction = async (
  id: string,
): Promise<ApiResponse<null> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid withdrawal id" };

  try {
    return await deleteProfitWithdrawal(id);
  } catch (error: unknown) {
    return {
      success: false,
      message: getActionErrorMessage(error, "Failed to delete withdrawal"),
    };
  }
};
