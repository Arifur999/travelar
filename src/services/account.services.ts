"use server";

import { httpClient } from "@/lib/axios/httpClient";
import {
  type IAccountBalance,
  type IAccountOverviewResponse,
  type IAccountsListResponse,
  type IBalanceTransfer,
  type IBalanceTransfersResponse,
  type ICreateBalanceTransferPayload,
  type ICreateCashAccountPayload,
  type IUpdateBalanceTransferPayload,
  type IUpdateCashAccountPayload,
} from "@/types/account.types";

/* ----------------------------- cash accounts ----------------------------- */

/**
 * Unpaginated, and the envelope nests: `data.data` is the accounts and
 * `data.summary` the totals. That is the API's own shape, not a wrapper added
 * here.
 */
export const getCashAccounts = async () => {
  try {
    return await httpClient.get<IAccountsListResponse>("/accounts");
  } catch (error) {
    console.error("Error fetching cash accounts:", error);
    throw error;
  }
};

/** The Balance Dashboard: one row per account, one column per money source. */
export const getAccountsOverview = async () => {
  try {
    return await httpClient.get<IAccountOverviewResponse>("/accounts/overview");
  } catch (error) {
    console.error("Error fetching balance overview:", error);
    throw error;
  }
};

export const getCashAccountById = async (id: string) => {
  try {
    return await httpClient.get<IAccountBalance>(`/accounts/${id}`);
  } catch (error) {
    console.error("Error fetching cash account:", error);
    throw error;
  }
};

export const createCashAccount = async (payload: ICreateCashAccountPayload) => {
  try {
    return await httpClient.post<IAccountBalance>("/accounts", payload);
  } catch (error) {
    console.error("Error creating cash account:", error);
    throw error;
  }
};

export const updateCashAccount = async (id: string, payload: IUpdateCashAccountPayload) => {
  try {
    return await httpClient.patch<IAccountBalance>(`/accounts/${id}`, payload);
  } catch (error) {
    console.error("Error updating cash account:", error);
    throw error;
  }
};

export const deleteCashAccount = async (id: string) => {
  try {
    return await httpClient.delete<null>(`/accounts/${id}`);
  } catch (error) {
    console.error("Error deleting cash account:", error);
    throw error;
  }
};

/* --------------------------- balance transfers --------------------------- */

/** Paginated. `data.transfers` plus `data.summary`, with `meta` alongside. */
export const getBalanceTransfers = async (queryString?: string) => {
  try {
    return await httpClient.get<IBalanceTransfersResponse>(
      `/balance-transfers${queryString ? `?${queryString}` : ""}`,
    );
  } catch (error) {
    console.error("Error fetching balance transfers:", error);
    throw error;
  }
};

export const createBalanceTransfer = async (payload: ICreateBalanceTransferPayload) => {
  try {
    return await httpClient.post<IBalanceTransfer>("/balance-transfers", payload);
  } catch (error) {
    console.error("Error creating balance transfer:", error);
    throw error;
  }
};

export const updateBalanceTransfer = async (
  id: string,
  payload: IUpdateBalanceTransferPayload,
) => {
  try {
    return await httpClient.patch<IBalanceTransfer>(`/balance-transfers/${id}`, payload);
  } catch (error) {
    console.error("Error updating balance transfer:", error);
    throw error;
  }
};

export const deleteBalanceTransfer = async (id: string) => {
  try {
    return await httpClient.delete<null>(`/balance-transfers/${id}`);
  } catch (error) {
    console.error("Error deleting balance transfer:", error);
    throw error;
  }
};
