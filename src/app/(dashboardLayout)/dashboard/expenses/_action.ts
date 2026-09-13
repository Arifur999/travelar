"use server";

import { getActionErrorMessage } from "@/lib/actionError";
import {
  createExpense,
  createExpenseCategory,
  deleteExpense,
  deleteExpenseCategory,
  updateExpense,
  updateExpenseCategory,
} from "@/services/expense.services";
import {
  createCategoryServerZodSchema,
  createExpenseServerZodSchema,
  updateCategoryServerZodSchema,
  updateExpenseServerZodSchema,
} from "@/zod/expense.validation";
import { type ApiErrorResponse, type ApiResponse } from "@/types/api.types";
import { type IExpense, type IExpenseCategory } from "@/types/expense.types";

/* ------------------------------- categories ------------------------------ */

export const createCategoryAction = async (
  payload: unknown,
): Promise<ApiResponse<IExpenseCategory> | ApiErrorResponse> => {
  const parsed = createCategoryServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    return await createExpenseCategory(parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to create category") };
  }
};

export const updateCategoryAction = async (
  id: string,
  payload: unknown,
): Promise<ApiResponse<IExpenseCategory> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid category id" };

  const parsed = updateCategoryServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    return await updateExpenseCategory(id, parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to update category") };
  }
};

export const deleteCategoryAction = async (
  id: string,
): Promise<ApiResponse<null> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid category id" };

  try {
    // Refused while expenses still reference it, and scoped by agency — the old
    // equivalent counted across every tenant, so one agency's spending could
    // block another's category from being deleted.
    return await deleteExpenseCategory(id);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to delete category") };
  }
};

/* -------------------------------- expenses ------------------------------- */

export const createExpenseAction = async (
  payload: unknown,
): Promise<ApiResponse<IExpense> | ApiErrorResponse> => {
  const parsed = createExpenseServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    // Not guarded against overdrawing: unlike a transfer between the agency's
    // own accounts, a real expense can legitimately take an account negative.
    return await createExpense(parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to record expense") };
  }
};

/**
 * Category, date and notes only. The amount and account have already posted to
 * the ledger, so correcting either means deleting the expense. Recategorising
 * is different — it moves no money, only which bucket the spend reports under.
 */
export const updateExpenseAction = async (
  id: string,
  payload: unknown,
): Promise<ApiResponse<IExpense> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid expense id" };

  const parsed = updateExpenseServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    return await updateExpense(id, parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to update expense") };
  }
};

export const deleteExpenseAction = async (
  id: string,
): Promise<ApiResponse<null> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid expense id" };

  try {
    // Reverses the posting, so the account goes back up.
    return await deleteExpense(id);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to delete expense") };
  }
};
