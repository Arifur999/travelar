"use server";

import { getActionErrorMessage } from "@/lib/actionError";
import {
  getImportRun,
  getImportRuns,
  previewImport,
  revertImport,
  startImport,
} from "@/services/import.services";
import { type ApiErrorResponse, type ApiResponse } from "@/types/api.types";
import {
  type IImportPreview,
  type IImportRun,
  type IImportStarted,
} from "@/types/import.types";

export const previewImportAction = async (
  formData: FormData,
): Promise<ApiResponse<IImportPreview> | ApiErrorResponse> => {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, message: "Choose the .xlsx file you exported from your sheet" };
  }

  try {
    // The file goes straight through to the API and is read in memory there —
    // it is the agency's whole book of business, so it is not stored anywhere
    // along the way.
    return await previewImport(formData);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Could not read that file") };
  }
};

/**
 * Starts the import and returns straight away.
 *
 * The run outlives this call — a year of business is a few thousand ledger
 * entries — so what comes back is the id of something already under way, or
 * the run that brought this same file in the last time.
 */
export const startImportAction = async (
  formData: FormData,
): Promise<ApiResponse<IImportStarted> | ApiErrorResponse> => {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, message: "Choose the .xlsx file you exported from your sheet" };
  }

  try {
    return await startImport(formData);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Could not start the import") };
  }
};

export const getImportRunAction = async (
  importId: string,
): Promise<ApiResponse<IImportRun> | ApiErrorResponse> => {
  try {
    return await getImportRun(importId);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Could not read the import") };
  }
};

export const getImportRunsAction = async (): Promise<
  ApiResponse<IImportRun[]> | ApiErrorResponse
> => {
  try {
    return await getImportRuns();
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Could not load your imports") };
  }
};

/**
 * Undoes one import.
 *
 * Refused where anything it created has been used since — a sale booked
 * against an imported customer — because taking the import back would take
 * that with it.
 */
export const revertImportAction = async (
  importId: string,
): Promise<ApiResponse<IImportRun> | ApiErrorResponse> => {
  try {
    return await revertImport(importId);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Could not undo that import") };
  }
};
