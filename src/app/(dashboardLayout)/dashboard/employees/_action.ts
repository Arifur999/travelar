"use server";

import { getActionErrorMessage } from "@/lib/actionError";
import {
  createAttendance,
  createEmployee,
  createEmployeeTransaction,
  deleteAttendance,
  deleteEmployee,
  deleteEmployeeTransaction,
  updateEmployee,
} from "@/services/employee.services";
import {
  createAttendanceServerZodSchema,
  createEmployeeServerZodSchema,
  createPayoutServerZodSchema,
  updateEmployeeServerZodSchema,
} from "@/zod/employee.validation";
import { type ApiErrorResponse, type ApiResponse } from "@/types/api.types";
import {
  type IEmployee,
  type IEmployeeAttendance,
  type IEmployeeTransaction,
} from "@/types/employee.types";

/* -------------------------------- employees ------------------------------ */

export const createEmployeeAction = async (
  payload: unknown,
): Promise<ApiResponse<IEmployee> | ApiErrorResponse> => {
  const parsed = createEmployeeServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    // The API also refuses a resign date before the join date.
    return await createEmployee(parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to create employee") };
  }
};

export const updateEmployeeAction = async (
  id: string,
  payload: unknown,
): Promise<ApiResponse<IEmployee> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid employee id" };

  const parsed = updateEmployeeServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    // Clearing the resign date (sending null) is what marks someone active
    // again — there is no separate flag to toggle.
    return await updateEmployee(id, parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to update employee") };
  }
};

export const deleteEmployeeAction = async (
  id: string,
): Promise<ApiResponse<null> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid employee id" };

  try {
    // Refused while payouts still reference them — record a resign date
    // instead to keep the history.
    return await deleteEmployee(id);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to delete employee") };
  }
};

/* --------------------------------- payouts ------------------------------- */

export const createPayoutAction = async (
  payload: unknown,
): Promise<ApiResponse<IEmployeeTransaction> | ApiErrorResponse> => {
  const parsed = createPayoutServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    // Not guarded against overdrawing: the API applies that only to transfers
    // between the agency's own accounts, so a payout can take an account
    // negative the same way an expense can.
    return await createEmployeeTransaction(parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to record payout") };
  }
};

/** AGENCY_ADMIN only on the API. */
export const deletePayoutAction = async (
  id: string,
): Promise<ApiResponse<null> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid payout id" };

  try {
    return await deleteEmployeeTransaction(id);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to delete payout") };
  }
};

/* ------------------------------- attendance ------------------------------ */

export const createAttendanceAction = async (
  payload: unknown,
): Promise<ApiResponse<IEmployeeAttendance> | ApiErrorResponse> => {
  const parsed = createAttendanceServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    // One row per employee per calendar day — a second entry for the same day
    // is refused by a unique constraint rather than silently overwriting.
    return await createAttendance(parsed.data);
  } catch (error: unknown) {
    return {
      success: false,
      message: getActionErrorMessage(error, "Failed to record attendance"),
    };
  }
};

export const deleteAttendanceAction = async (
  id: string,
): Promise<ApiResponse<null> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid attendance id" };

  try {
    return await deleteAttendance(id);
  } catch (error: unknown) {
    return {
      success: false,
      message: getActionErrorMessage(error, "Failed to delete attendance"),
    };
  }
};
