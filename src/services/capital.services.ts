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
  try {
    return await httpClient.get<ICapitalFlowsListResponse>(
      `/capital${queryString ? `?${queryString}` : ""}`,
    );
  } catch (error) {
    console.error("Error fetching capital entries:", error);
    throw error;
  }
};

/** Per-owner totals and share of the business. */
export const getCapitalSummary = async () => {
  try {
    return await httpClient.get<ICapitalSummary>("/capital/summary");
  } catch (error) {
    console.error("Error fetching capital summary:", error);
    throw error;
  }
};

export const createCapitalFlow = async (payload: ICreateCapitalFlowPayload) => {
  try {
    return await httpClient.post<ICapitalFlow>("/capital", payload);
  } catch (error) {
    console.error("Error recording capital entry:", error);
    throw error;
  }
};

export const updateCapitalFlow = async (id: string, payload: IUpdateDateNotePayload) => {
  try {
    return await httpClient.patch<ICapitalFlow>(`/capital/${id}`, payload);
  } catch (error) {
    console.error("Error updating capital entry:", error);
    throw error;
  }
};

export const deleteCapitalFlow = async (id: string) => {
  try {
    return await httpClient.delete<null>(`/capital/${id}`);
  } catch (error) {
    console.error("Error deleting capital entry:", error);
    throw error;
  }
};

/* --------------------------- profit withdrawals -------------------------- */

export const getProfitWithdrawals = async (queryString?: string) => {
  try {
    return await httpClient.get<IProfitWithdrawalsListResponse>(
      `/capital/withdrawals${queryString ? `?${queryString}` : ""}`,
    );
  } catch (error) {
    console.error("Error fetching profit withdrawals:", error);
    throw error;
  }
};

export const createProfitWithdrawal = async (payload: ICreateProfitWithdrawalPayload) => {
  try {
    return await httpClient.post<IProfitWithdrawal>("/capital/withdrawals", payload);
  } catch (error) {
    console.error("Error recording profit withdrawal:", error);
    throw error;
  }
};

export const updateProfitWithdrawal = async (
  id: string,
  payload: IUpdateDateNotePayload,
) => {
  try {
    return await httpClient.patch<IProfitWithdrawal>(`/capital/withdrawals/${id}`, payload);
  } catch (error) {
    console.error("Error updating profit withdrawal:", error);
    throw error;
  }
};

export const deleteProfitWithdrawal = async (id: string) => {
  try {
    return await httpClient.delete<null>(`/capital/withdrawals/${id}`);
  } catch (error) {
    console.error("Error deleting profit withdrawal:", error);
    throw error;
  }
};
