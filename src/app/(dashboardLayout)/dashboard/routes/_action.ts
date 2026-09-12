"use server";

import { getActionErrorMessage } from "@/lib/actionError";
import { createRoute, deleteRoute, updateRoute } from "@/services/masterData.services";
import { createRouteServerZodSchema } from "@/zod/masterData.validation";
import { type ApiErrorResponse, type ApiResponse } from "@/types/api.types";
import { type IRoute } from "@/types/masterData.types";

export const createRouteAction = async (
  payload: unknown,
): Promise<ApiResponse<IRoute> | ApiErrorResponse> => {
  const parsed = createRouteServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    return await createRoute(parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to create route") };
  }
};

export const updateRouteAction = async (
  id: string,
  payload: unknown,
): Promise<ApiResponse<IRoute> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid route id" };

  const parsed = createRouteServerZodSchema.partial().safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    return await updateRoute(id, parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to update route") };
  }
};

export const deleteRouteAction = async (
  id: string,
): Promise<ApiResponse<{ message: string }> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid route id" };

  try {
    return await deleteRoute(id);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to delete route") };
  }
};
