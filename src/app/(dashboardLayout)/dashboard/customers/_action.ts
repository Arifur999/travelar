"use server";

import { getActionErrorMessage } from "@/lib/actionError";
import { createCustomer, deleteCustomer, updateCustomer } from "@/services/customer.services";
import {
  createCustomerServerZodSchema,
  updateCustomerServerZodSchema,
} from "@/zod/customer.validation";
import { type ApiErrorResponse, type ApiResponse } from "@/types/api.types";
import { type ICustomer } from "@/types/customer.types";

export const createCustomerAction = async (
  payload: unknown,
): Promise<ApiResponse<ICustomer> | ApiErrorResponse> => {
  const parsed = createCustomerServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    // The API rejects a duplicate phone within the agency, which is the real
    // identity check for a customer — that message is worth showing as-is.
    return await createCustomer(parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to create customer") };
  }
};

export const updateCustomerAction = async (
  id: string,
  payload: unknown,
): Promise<ApiResponse<ICustomer> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid customer id" };

  const parsed = updateCustomerServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    return await updateCustomer(id, parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to update customer") };
  }
};

export const deleteCustomerAction = async (
  id: string,
): Promise<ApiResponse<null> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid customer id" };

  try {
    // Refused while any ticket, visa case, hajj booking or receipt still
    // references them.
    return await deleteCustomer(id);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to delete customer") };
  }
};
