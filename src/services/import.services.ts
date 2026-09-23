"use server";

import { httpClient } from "@/lib/axios/httpClient";
import { type IImportPreview } from "@/types/import.types";

/**
 * Reads an uploaded workbook and reports what is in it. Writes nothing, so it
 * is safe to run as many times as it takes to get the file right.
 */
export const previewImport = async (formData: FormData) => {
  return await httpClient.postFormData<IImportPreview>("/imports/preview", formData);
};
