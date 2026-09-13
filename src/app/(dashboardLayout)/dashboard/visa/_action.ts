"use server";

import { getActionErrorMessage } from "@/lib/actionError";
import {
  addVisaDocument,
  changeVisaStatus,
  createVisaAgent,
  createVisaCase,
  deleteVisaAgent,
  deleteVisaCase,
  deleteVisaDocument,
  deleteVisaPayment,
  recordVisaPayment,
  setVisaDocumentStatus,
  updateVisaAgent,
  updateVisaCase,
} from "@/services/visa.services";
import {
  changeVisaStatusServerZodSchema,
  createVisaAgentServerZodSchema,
  createVisaCaseServerZodSchema,
  updateVisaAgentServerZodSchema,
  updateVisaCaseServerZodSchema,
  visaDocumentServerZodSchema,
  visaPaymentServerZodSchema,
} from "@/zod/visa.validation";
import { type ApiErrorResponse, type ApiResponse } from "@/types/api.types";
import { type DocumentStatus } from "@/types/enums.types";
import {
  type IVisaAgent,
  type IVisaCase,
  type IVisaCaseDetail,
} from "@/types/visa.types";

/* ------------------------------- visa cases ------------------------------ */

export const createVisaCaseAction = async (
  payload: unknown,
): Promise<ApiResponse<IVisaCase> | ApiErrorResponse> => {
  const parsed = createVisaCaseServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    // A new case always starts at SUBMITTED — the API forces the initial state
    // rather than accepting one from the body, which is how the old code let a
    // case be created as already delivered.
    return await createVisaCase(parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to create case") };
  }
};

export const updateVisaCaseAction = async (
  id: string,
  payload: unknown,
): Promise<ApiResponse<IVisaCaseDetail> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid case id" };

  const parsed = updateVisaCaseServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    return await updateVisaCase(id, parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to update case") };
  }
};

export const changeVisaStatusAction = async (
  id: string,
  payload: unknown,
): Promise<ApiResponse<IVisaCaseDetail> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid case id" };

  const parsed = changeVisaStatusServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    // The API enforces the transition table, which is stricter than the ticket
    // one: a case must pass through PROCESSING before it can be decided.
    return await changeVisaStatus(id, parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to change status") };
  }
};

/** AGENCY_ADMIN only on the API. */
export const deleteVisaCaseAction = async (
  id: string,
): Promise<ApiResponse<null> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid case id" };

  try {
    return await deleteVisaCase(id);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to delete case") };
  }
};

/* -------------------------------- documents ------------------------------ */

export const addVisaDocumentAction = async (
  id: string,
  payload: unknown,
): Promise<ApiResponse<IVisaCaseDetail> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid case id" };

  const parsed = visaDocumentServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    return await addVisaDocument(id, parsed.data.title);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to add document") };
  }
};

/**
 * Documents are real rows with ids, not array positions.
 *
 * The old implementation addressed a checklist item by index, so reordering or
 * removing one silently retargeted every later item — and toggling back to
 * pending orphaned the uploaded file on disk.
 */
export const setVisaDocumentStatusAction = async (
  id: string,
  documentId: string,
  documentStatus: DocumentStatus,
): Promise<ApiResponse<IVisaCaseDetail> | ApiErrorResponse> => {
  if (!id || !documentId) return { success: false, message: "Invalid document" };

  try {
    return await setVisaDocumentStatus(id, documentId, documentStatus);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to update document") };
  }
};

export const deleteVisaDocumentAction = async (
  id: string,
  documentId: string,
): Promise<ApiResponse<IVisaCaseDetail> | ApiErrorResponse> => {
  if (!id || !documentId) return { success: false, message: "Invalid document" };

  try {
    return await deleteVisaDocument(id, documentId);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to delete document") };
  }
};

/* -------------------------------- payments ------------------------------- */

export const recordVisaPaymentAction = async (
  id: string,
  payload: unknown,
): Promise<ApiResponse<IVisaCaseDetail> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid case id" };

  const parsed = visaPaymentServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    // Invoice-level, so capped at the outstanding due inside a transaction.
    return await recordVisaPayment(id, parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to record payment") };
  }
};

/** AGENCY_ADMIN only on the API. */
export const deleteVisaPaymentAction = async (
  id: string,
  paymentId: string,
): Promise<ApiResponse<IVisaCaseDetail> | ApiErrorResponse> => {
  if (!id || !paymentId) return { success: false, message: "Invalid payment" };

  try {
    return await deleteVisaPayment(id, paymentId);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to delete payment") };
  }
};

/* --------------------------------- agents -------------------------------- */

export const createVisaAgentAction = async (
  payload: unknown,
): Promise<ApiResponse<IVisaAgent> | ApiErrorResponse> => {
  const parsed = createVisaAgentServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    return await createVisaAgent(parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to create agent") };
  }
};

export const updateVisaAgentAction = async (
  id: string,
  payload: unknown,
): Promise<ApiResponse<IVisaAgent> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid agent id" };

  const parsed = updateVisaAgentServerZodSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    return await updateVisaAgent(id, parsed.data);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to update agent") };
  }
};

export const deleteVisaAgentAction = async (
  id: string,
): Promise<ApiResponse<null> | ApiErrorResponse> => {
  if (!id) return { success: false, message: "Invalid agent id" };

  try {
    // Refused while cases still reference the agent.
    return await deleteVisaAgent(id);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Failed to delete agent") };
  }
};
