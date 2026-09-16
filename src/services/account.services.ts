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
  return await httpClient.get<IAccountsListResponse>("/accounts");
};

/** The Balance Dashboard: one row per account, one column per money source. */
export const getAccountsOverview = async () => {
  return await httpClient.get<IAccountOverviewResponse>("/accounts/overview");
};

export const getCashAccountById = async (id: string) => {
  return await httpClient.get<IAccountBalance>(`/accounts/${id}`);
};

export const createCashAccount = async (payload: ICreateCashAccountPayload) => {
  return await httpClient.post<IAccountBalance>("/accounts", payload);
};

export const updateCashAccount = async (id: string, payload: IUpdateCashAccountPayload) => {
  return await httpClient.patch<IAccountBalance>(`/accounts/${id}`, payload);
};

export const deleteCashAccount = async (id: string) => {
  return await httpClient.delete<null>(`/accounts/${id}`);
};

/* --------------------------- balance transfers --------------------------- */

/** Paginated. `data.transfers` plus `data.summary`, with `meta` alongside. */
export const getBalanceTransfers = async (queryString?: string) => {
  return await httpClient.get<IBalanceTransfersResponse>(
    `/balance-transfers${queryString ? `?${queryString}` : ""}`,
  );
};

export const createBalanceTransfer = async (payload: ICreateBalanceTransferPayload) => {
  return await httpClient.post<IBalanceTransfer>("/balance-transfers", payload);
};

export const updateBalanceTransfer = async (
  id: string,
  payload: IUpdateBalanceTransferPayload,
) => {
  return await httpClient.patch<IBalanceTransfer>(`/balance-transfers/${id}`, payload);
};

export const deleteBalanceTransfer = async (id: string) => {
  return await httpClient.delete<null>(`/balance-transfers/${id}`);
};
