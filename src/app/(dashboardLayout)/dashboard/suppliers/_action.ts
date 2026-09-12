"use server";

import { getActionErrorMessage } from "@/lib/actionError";
import {
  createSupplier,
  deleteSupplier,
  updateSupplier,
} from "@/services/supplier.services";
import {
  createSupplierServerZodSchema,
  updateSupplierServerZodSchema,
} from "@/zod/supplier.validation";
import { type ApiErrorResponse, type ApiResponse } from "@/types/api.types";
import { type ISupplier } from "@/types/supplier.types";

export const createSupplierAction = async (
  payload: unknown,
): Promise<ApiResponse<ISupplier> | ApiErrorResponse> => {
  const parsed = createSupplierServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    return await createSupplier(parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to create supplier") };
  }
};

export const updateSupplierAction = async (
  id: string,
  payload: unknown,
): Promise<ApiResponse<ISupplier> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid supplier id" };

  const parsed = updateSupplierServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    return await updateSupplier(id, parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to update supplier") };
  }
};

export const deleteSupplierAction = async (
  id: string,
): Promise<ApiResponse<null> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid supplier id" };

  try {
    // Refused while tickets or payments still reference the supplier — those
    // rows would otherwise point at a vendor nobody can look up.
    return await deleteSupplier(id);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to delete supplier") };
  }
};
