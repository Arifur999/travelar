"use server";

import { getActionErrorMessage } from "@/lib/actionError";
import { previewImport } from "@/services/import.services";
import { type ApiErrorResponse, type ApiResponse } from "@/types/api.types";
import { type IImportPreview } from "@/types/import.types";

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
