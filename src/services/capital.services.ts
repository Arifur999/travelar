"use server";

import { httpClient } from "@/lib/axios/httpClient";
import {
  type ICapitalFlow,
  type ICapitalFlowsListResponse,
  type ICapitalSummary,
  type ICreateCapitalFlowPayload,
  type ICreateProfitWithdrawalPayload,
  type IProfitWithdrawal,
  type IProfitWithdrawalsListResponse,
  type IUpdateDateNotePayload,
} from "@/types/capital.types";

/**
 * Every route here is AGENCY_ADMIN only on the API — owner capital is not
 * general staff's business. The nav entry is restricted to match.
 */

/* ------------------------------ capital flows ---------------------------- */

export const getCapitalFlows = async (queryString?: string) => {
  return await httpClient.get<ICapitalFlowsListResponse>(
    `/capital${queryString ? `?${queryString}` : ""}`,
  );
};

/** Per-owner totals and share of the business. */
export const getCapitalSummary = async () => {
  return await httpClient.get<ICapitalSummary>("/capital/summary");
};

export const createCapitalFlow = async (payload: ICreateCapitalFlowPayload) => {
  return await httpClient.post<ICapitalFlow>("/capital", payload);
};

export const updateCapitalFlow = async (id: string, payload: IUpdateDateNotePayload) => {
  return await httpClient.patch<ICapitalFlow>(`/capital/${id}`, payload);
};

export const deleteCapitalFlow = async (id: string) => {
  return await httpClient.delete<null>(`/capital/${id}`);
};

/* --------------------------- profit withdrawals -------------------------- */

export const getProfitWithdrawals = async (queryString?: string) => {
  return await httpClient.get<IProfitWithdrawalsListResponse>(
    `/capital/withdrawals${queryString ? `?${queryString}` : ""}`,
  );
};

export const createProfitWithdrawal = async (payload: ICreateProfitWithdrawalPayload) => {
  return await httpClient.post<IProfitWithdrawal>("/capital/withdrawals", payload);
};

export const updateProfitWithdrawal = async (
  id: string,
  payload: IUpdateDateNotePayload,
) => {
  return await httpClient.patch<IProfitWithdrawal>(`/capital/withdrawals/${id}`, payload);
};

export const deleteProfitWithdrawal = async (id: string) => {
  return await httpClient.delete<null>(`/capital/withdrawals/${id}`);
};
