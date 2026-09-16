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
  return await httpClient.get<IVisaCasesListResponse>(
    `/visa${queryString ? `?${queryString}` : ""}`,
  );
};

/** Includes documents, payments and status history; the list does not. */
export const getVisaCaseById = async (id: string) => {
  return await httpClient.get<IVisaCaseDetail>(`/visa/${id}`);
};

export const createVisaCase = async (payload: ICreateVisaCasePayload) => {
  return await httpClient.post<IVisaCase>("/visa", payload);
};

export const updateVisaCase = async (id: string, payload: IUpdateVisaCasePayload) => {
  return await httpClient.patch<IVisaCaseDetail>(`/visa/${id}`, payload);
};

/** Its own route — the generic update deliberately cannot set status. */
export const changeVisaStatus = async (id: string, payload: IChangeVisaStatusPayload) => {
  return await httpClient.patch<IVisaCaseDetail>(`/visa/${id}/status`, payload);
};

/** AGENCY_ADMIN only. */
export const deleteVisaCase = async (id: string) => {
  return await httpClient.delete<null>(`/visa/${id}`);
};

/* -------------------------------- documents ------------------------------ */

export const addVisaDocument = async (id: string, title: string) => {
  return await httpClient.post<IVisaCaseDetail>(`/visa/${id}/documents`, { title });
};

export const setVisaDocumentStatus = async (
  id: string,
  documentId: string,
  documentStatus: DocumentStatus,
) => {
  return await httpClient.patch<IVisaCaseDetail>(`/visa/${id}/documents/${documentId}`, {
    status: documentStatus,
  });
};

export const deleteVisaDocument = async (id: string, documentId: string) => {
  return await httpClient.delete<IVisaCaseDetail>(`/visa/${id}/documents/${documentId}`);
};

/* -------------------------------- payments ------------------------------- */

export const recordVisaPayment = async (id: string, payload: IRecordVisaPaymentPayload) => {
  return await httpClient.post<IVisaCaseDetail>(`/visa/${id}/payments`, payload);
};

/** AGENCY_ADMIN only. */
export const deleteVisaPayment = async (id: string, paymentId: string) => {
  return await httpClient.delete<IVisaCaseDetail>(`/visa/${id}/payments/${paymentId}`);
};

/* --------------------------------- agents -------------------------------- */

export const getVisaAgents = async (queryString?: string) => {
  return await httpClient.get<IVisaAgent[]>(
    `/visa/agents${queryString ? `?${queryString}` : ""}`,
  );
};

export const createVisaAgent = async (payload: ICreateVisaAgentPayload) => {
  return await httpClient.post<IVisaAgent>("/visa/agents", payload);
};

export const updateVisaAgent = async (
  id: string,
  payload: Partial<ICreateVisaAgentPayload>,
) => {
  return await httpClient.patch<IVisaAgent>(`/visa/agents/${id}`, payload);
};

export const deleteVisaAgent = async (id: string) => {
  return await httpClient.delete<null>(`/visa/agents/${id}`);
};
