"use server";

import { getActionErrorMessage } from "@/lib/actionError";
import { createAirline, deleteAirline, updateAirline } from "@/services/masterData.services";
import { createAirlineServerZodSchema } from "@/zod/masterData.validation";
import { type ApiErrorResponse, type ApiResponse } from "@/types/api.types";
import { type IAirline } from "@/types/masterData.types";

export const createAirlineAction = async (
  payload: unknown,
): Promise<ApiResponse<IAirline> | ApiErrorResponse> => {
  // Re-validate on the server — the client schema only guards the UI, and an
  // action is a public endpoint.
  const parsed = createAirlineServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    return await createAirline(parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to create airline") };
  }
};

export const updateAirlineAction = async (
  id: string,
  payload: unknown,
): Promise<ApiResponse<IAirline> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid airline id" };

  const parsed = createAirlineServerZodSchema.partial().safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    return await updateAirline(id, parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to update airline") };
  }
};

export const deleteAirlineAction = async (
  id: string,
): Promise<ApiResponse<{ message: string }> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid airline id" };

  try {
    // The API refuses this while tickets still reference the airline, and that
    // message is worth showing verbatim rather than replacing with a generic
    // failure.
    return await deleteAirline(id);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to delete airline") };
  }
};
