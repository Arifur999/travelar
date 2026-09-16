"use server";

import { httpClient } from "@/lib/axios/httpClient";
import {
  type ICreateSupplierPayload,
  type ICreateSupplierTransactionPayload,
  type ICreateSupplierTransactionResponse,
  type ISupplier,
  type ISupplierDashboard,
  type ISupplierLedger,
  type ISupplierTransaction,
  type ISupplierTransactionsResponse,
  type IUpdateSupplierPayload,
  type IUpdateSupplierTransactionPayload,
} from "@/types/supplier.types";

/* -------------------------------- suppliers ------------------------------ */

export const getSuppliers = async (queryString?: string) => {
  return await httpClient.get<ISupplier[]>(`/suppliers${queryString ? `?${queryString}` : ""}`);
};

/**
 * Whole-book totals, unpaginated. `sort` accepts only
 * currentPayableDesc (default) | currentPayableAsc | nameAsc.
 */
export const getSupplierDashboard = async (sort?: string) => {
  return await httpClient.get<ISupplierDashboard>(
    `/suppliers/dashboard${sort ? `?sort=${encodeURIComponent(sort)}` : ""}`,
  );
};

export const getSupplierById = async (id: string) => {
  return await httpClient.get<ISupplier>(`/suppliers/${id}`);
};

/** Chronological statement with a running payable, opening balance first. */
export const getSupplierLedger = async (id: string) => {
  return await httpClient.get<ISupplierLedger>(`/suppliers/${id}/ledger`);
};

export const createSupplier = async (payload: ICreateSupplierPayload) => {
  return await httpClient.post<ISupplier>("/suppliers", payload);
};

export const updateSupplier = async (id: string, payload: IUpdateSupplierPayload) => {
  return await httpClient.patch<ISupplier>(`/suppliers/${id}`, payload);
};

export const deleteSupplier = async (id: string) => {
  return await httpClient.delete<null>(`/suppliers/${id}`);
};

/* --------------------------- supplier payments --------------------------- */

export const getSupplierTransactions = async (queryString?: string) => {
  return await httpClient.get<ISupplierTransactionsResponse>(
    `/supplier-transactions${queryString ? `?${queryString}` : ""}`,
  );
};

export const createSupplierTransaction = async (
  payload: ICreateSupplierTransactionPayload,
) => {
  return await httpClient.post<ICreateSupplierTransactionResponse>(
    "/supplier-transactions",
    payload,
  );
};

export const updateSupplierTransaction = async (
  id: string,
  payload: IUpdateSupplierTransactionPayload,
) => {
  return await httpClient.patch<ISupplierTransaction>(
    `/supplier-transactions/${id}`,
    payload,
  );
};

/** AGENCY_ADMIN only — reversing a posted payment moves an account balance. */
export const deleteSupplierTransaction = async (id: string) => {
  return await httpClient.delete<null>(`/supplier-transactions/${id}`);
};
