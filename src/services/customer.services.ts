"use server";

import { httpClient } from "@/lib/axios/httpClient";
import {
  type ICreateCustomerPayload,
  type ICreateDueReceivedPayload,
  type ICreateDueReceivedResponse,
  type ICustomer,
  type ICustomerDashboard,
  type ICustomerLedger,
  type IDueReceived,
  type IDueReceivedListResponse,
  type IUpdateCustomerPayload,
  type IUpdateDueReceivedPayload,
} from "@/types/customer.types";

/* -------------------------------- customers ------------------------------ */

export const getCustomers = async (queryString?: string) => {
  try {
    return await httpClient.get<ICustomer[]>(`/customers${queryString ? `?${queryString}` : ""}`);
  } catch (error) {
    console.error("Error fetching customers:", error);
    throw error;
  }
};

/**
 * Whole-book totals, unpaginated. `sort` accepts only
 * currentDueDesc (default) | currentDueAsc | nameAsc.
 */
export const getCustomerDashboard = async (sort?: string) => {
  try {
    return await httpClient.get<ICustomerDashboard>(
      `/customers/dashboard${sort ? `?sort=${encodeURIComponent(sort)}` : ""}`,
    );
  } catch (error) {
    console.error("Error fetching customer dashboard:", error);
    throw error;
  }
};

export const getCustomerById = async (id: string) => {
  try {
    return await httpClient.get<ICustomer>(`/customers/${id}`);
  } catch (error) {
    console.error("Error fetching customer:", error);
    throw error;
  }
};

export const getCustomerLedger = async (id: string) => {
  try {
    return await httpClient.get<ICustomerLedger>(`/customers/${id}/ledger`);
  } catch (error) {
    console.error("Error fetching customer ledger:", error);
    throw error;
  }
};

export const createCustomer = async (payload: ICreateCustomerPayload) => {
  try {
    return await httpClient.post<ICustomer>("/customers", payload);
  } catch (error) {
    console.error("Error creating customer:", error);
    throw error;
  }
};

export const updateCustomer = async (id: string, payload: IUpdateCustomerPayload) => {
  try {
    return await httpClient.patch<ICustomer>(`/customers/${id}`, payload);
  } catch (error) {
    console.error("Error updating customer:", error);
    throw error;
  }
};

export const deleteCustomer = async (id: string) => {
  try {
    return await httpClient.delete<null>(`/customers/${id}`);
  } catch (error) {
    console.error("Error deleting customer:", error);
    throw error;
  }
};

/* ------------------------------- collections ----------------------------- */

export const getDueReceipts = async (queryString?: string) => {
  try {
    return await httpClient.get<IDueReceivedListResponse>(
      `/due-received${queryString ? `?${queryString}` : ""}`,
    );
  } catch (error) {
    console.error("Error fetching collections:", error);
    throw error;
  }
};

export const createDueReceipt = async (payload: ICreateDueReceivedPayload) => {
  try {
    return await httpClient.post<ICreateDueReceivedResponse>("/due-received", payload);
  } catch (error) {
    console.error("Error recording collection:", error);
    throw error;
  }
};

export const updateDueReceipt = async (id: string, payload: IUpdateDueReceivedPayload) => {
  try {
    return await httpClient.patch<IDueReceived>(`/due-received/${id}`, payload);
  } catch (error) {
    console.error("Error updating collection:", error);
    throw error;
  }
};

export const deleteDueReceipt = async (id: string) => {
  try {
    return await httpClient.delete<null>(`/due-received/${id}`);
  } catch (error) {
    console.error("Error deleting collection:", error);
    throw error;
  }
};
