"use server";

import { httpClient } from "@/lib/axios/httpClient";
import {
  type IChangeVisaStatusPayload,
  type ICreateVisaAgentPayload,
  type ICreateVisaCasePayload,
  type IRecordVisaPaymentPayload,
  type IUpdateVisaCasePayload,
  type IVisaAgent,
  type IVisaCase,
  type IVisaCaseDetail,
  type IVisaCasesListResponse,
} from "@/types/visa.types";
import { type DocumentStatus } from "@/types/enums.types";

/* ------------------------------- visa cases ------------------------------ */

export const getVisaCases = async (queryString?: string) => {
  try {
    return await httpClient.get<IVisaCasesListResponse>(
      `/visa${queryString ? `?${queryString}` : ""}`,
    );
  } catch (error) {
    console.error("Error fetching visa cases:", error);
    throw error;
  }
};

/** Includes documents, payments and status history; the list does not. */
export const getVisaCaseById = async (id: string) => {
  try {
    return await httpClient.get<IVisaCaseDetail>(`/visa/${id}`);
  } catch (error) {
    console.error("Error fetching visa case:", error);
    throw error;
  }
};

export const createVisaCase = async (payload: ICreateVisaCasePayload) => {
  try {
    return await httpClient.post<IVisaCase>("/visa", payload);
  } catch (error) {
    console.error("Error creating visa case:", error);
    throw error;
  }
};

export const updateVisaCase = async (id: string, payload: IUpdateVisaCasePayload) => {
  try {
    return await httpClient.patch<IVisaCaseDetail>(`/visa/${id}`, payload);
  } catch (error) {
    console.error("Error updating visa case:", error);
    throw error;
  }
};

/** Its own route — the generic update deliberately cannot set status. */
export const changeVisaStatus = async (id: string, payload: IChangeVisaStatusPayload) => {
  try {
    return await httpClient.patch<IVisaCaseDetail>(`/visa/${id}/status`, payload);
  } catch (error) {
    console.error("Error changing visa status:", error);
    throw error;
  }
};

/** AGENCY_ADMIN only. */
export const deleteVisaCase = async (id: string) => {
  try {
    return await httpClient.delete<null>(`/visa/${id}`);
  } catch (error) {
    console.error("Error deleting visa case:", error);
    throw error;
  }
};

/* -------------------------------- documents ------------------------------ */

export const addVisaDocument = async (id: string, title: string) => {
  try {
    return await httpClient.post<IVisaCaseDetail>(`/visa/${id}/documents`, { title });
  } catch (error) {
    console.error("Error adding visa document:", error);
    throw error;
  }
};

export const setVisaDocumentStatus = async (
  id: string,
  documentId: string,
  documentStatus: DocumentStatus,
) => {
  try {
    return await httpClient.patch<IVisaCaseDetail>(`/visa/${id}/documents/${documentId}`, {
      status: documentStatus,
    });
  } catch (error) {
    console.error("Error updating visa document:", error);
    throw error;
  }
};

export const deleteVisaDocument = async (id: string, documentId: string) => {
  try {
    return await httpClient.delete<IVisaCaseDetail>(`/visa/${id}/documents/${documentId}`);
  } catch (error) {
    console.error("Error deleting visa document:", error);
    throw error;
  }
};

/* -------------------------------- payments ------------------------------- */

export const recordVisaPayment = async (id: string, payload: IRecordVisaPaymentPayload) => {
  try {
    return await httpClient.post<IVisaCaseDetail>(`/visa/${id}/payments`, payload);
  } catch (error) {
    console.error("Error recording visa payment:", error);
    throw error;
  }
};

/** AGENCY_ADMIN only. */
export const deleteVisaPayment = async (id: string, paymentId: string) => {
  try {
    return await httpClient.delete<IVisaCaseDetail>(`/visa/${id}/payments/${paymentId}`);
  } catch (error) {
    console.error("Error deleting visa payment:", error);
    throw error;
  }
};

/* --------------------------------- agents -------------------------------- */

export const getVisaAgents = async (queryString?: string) => {
  try {
    return await httpClient.get<IVisaAgent[]>(
      `/visa/agents${queryString ? `?${queryString}` : ""}`,
    );
  } catch (error) {
    console.error("Error fetching visa agents:", error);
    throw error;
  }
};

export const createVisaAgent = async (payload: ICreateVisaAgentPayload) => {
  try {
    return await httpClient.post<IVisaAgent>("/visa/agents", payload);
  } catch (error) {
    console.error("Error creating visa agent:", error);
    throw error;
  }
};

export const updateVisaAgent = async (
  id: string,
  payload: Partial<ICreateVisaAgentPayload>,
) => {
  try {
    return await httpClient.patch<IVisaAgent>(`/visa/agents/${id}`, payload);
  } catch (error) {
    console.error("Error updating visa agent:", error);
    throw error;
  }
};

export const deleteVisaAgent = async (id: string) => {
  try {
    return await httpClient.delete<null>(`/visa/agents/${id}`);
  } catch (error) {
    console.error("Error deleting visa agent:", error);
    throw error;
  }
};
