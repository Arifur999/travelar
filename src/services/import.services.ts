"use server";

import { httpClient } from "@/lib/axios/httpClient";
import {
  type IImportPreview,
  type IImportRun,
  type IImportStarted,
} from "@/types/import.types";

/**
 * Reads an uploaded workbook and reports what is in it. Writes nothing, so it
 * is safe to run as many times as it takes to get the file right.
 */
export const previewImport = async (formData: FormData) => {
  return await httpClient.postFormData<IImportPreview>("/imports/preview", formData);
};

/**
 * Brings the whole workbook in: the lists, then the history on top.
 *
 * Answers as soon as the run has started, not when it has finished — a year of
 * business takes minutes to write, and the page follows the run by its id.
 */
export const startImport = async (formData: FormData) => {
  return await httpClient.postFormData<IImportStarted>("/imports/run", formData);
};

/** One run, which is what the page polls while the bar is moving. */
export const getImportRun = async (importId: string) => {
  return await httpClient.get<IImportRun>(`/imports/${importId}`);
};

/** Every upload this agency has made, newest first. */
export const getImportRuns = async () => {
  return await httpClient.get<IImportRun[]>("/imports");
};

/** Takes one run back out again — every row it created, and its ledger entries. */
export const revertImport = async (importId: string) => {
  return await httpClient.delete<IImportRun>(`/imports/${importId}`);
};
