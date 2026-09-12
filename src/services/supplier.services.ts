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
  try {
    return await httpClient.get<ISupplier[]>(`/suppliers${queryString ? `?${queryString}` : ""}`);
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    throw error;
  }
};

/**
 * Whole-book totals, unpaginated. `sort` accepts only
 * currentPayableDesc (default) | currentPayableAsc | nameAsc.
 */
export const getSupplierDashboard = async (sort?: string) => {
  try {
    return await httpClient.get<ISupplierDashboard>(
      `/suppliers/dashboard${sort ? `?sort=${encodeURIComponent(sort)}` : ""}`,
    );
  } catch (error) {
    console.error("Error fetching supplier dashboard:", error);
    throw error;
  }
};

export const getSupplierById = async (id: string) => {
  try {
    return await httpClient.get<ISupplier>(`/suppliers/${id}`);
  } catch (error) {
    console.error("Error fetching supplier:", error);
    throw error;
  }
};

/** Chronological statement with a running payable, opening balance first. */
export const getSupplierLedger = async (id: string) => {
  try {
    return await httpClient.get<ISupplierLedger>(`/suppliers/${id}/ledger`);
  } catch (error) {
    console.error("Error fetching supplier ledger:", error);
    throw error;
  }
};

export const createSupplier = async (payload: ICreateSupplierPayload) => {
  try {
    return await httpClient.post<ISupplier>("/suppliers", payload);
  } catch (error) {
    console.error("Error creating supplier:", error);
    throw error;
  }
};

export const updateSupplier = async (id: string, payload: IUpdateSupplierPayload) => {
  try {
    return await httpClient.patch<ISupplier>(`/suppliers/${id}`, payload);
  } catch (error) {
    console.error("Error updating supplier:", error);
    throw error;
  }
};

export const deleteSupplier = async (id: string) => {
  try {
    return await httpClient.delete<null>(`/suppliers/${id}`);
  } catch (error) {
    console.error("Error deleting supplier:", error);
    throw error;
  }
};

/* --------------------------- supplier payments --------------------------- */

export const getSupplierTransactions = async (queryString?: string) => {
  try {
    return await httpClient.get<ISupplierTransactionsResponse>(
      `/supplier-transactions${queryString ? `?${queryString}` : ""}`,
    );
  } catch (error) {
    console.error("Error fetching supplier payments:", error);
    throw error;
  }
};

export const createSupplierTransaction = async (
  payload: ICreateSupplierTransactionPayload,
) => {
  try {
    return await httpClient.post<ICreateSupplierTransactionResponse>(
      "/supplier-transactions",
      payload,
    );
  } catch (error) {
    console.error("Error recording supplier payment:", error);
    throw error;
  }
};

export const updateSupplierTransaction = async (
  id: string,
  payload: IUpdateSupplierTransactionPayload,
) => {
  try {
    return await httpClient.patch<ISupplierTransaction>(
      `/supplier-transactions/${id}`,
      payload,
    );
  } catch (error) {
    console.error("Error updating supplier payment:", error);
    throw error;
  }
};

/** AGENCY_ADMIN only — reversing a posted payment moves an account balance. */
export const deleteSupplierTransaction = async (id: string) => {
  try {
    return await httpClient.delete<null>(`/supplier-transactions/${id}`);
  } catch (error) {
    console.error("Error deleting supplier payment:", error);
    throw error;
  }
};
