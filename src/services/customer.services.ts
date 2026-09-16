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
  return await httpClient.get<ICustomer[]>(`/customers${queryString ? `?${queryString}` : ""}`);
};

/**
 * Whole-book totals, unpaginated. `sort` accepts only
 * currentDueDesc (default) | currentDueAsc | nameAsc.
 */
export const getCustomerDashboard = async (sort?: string) => {
  return await httpClient.get<ICustomerDashboard>(
    `/customers/dashboard${sort ? `?sort=${encodeURIComponent(sort)}` : ""}`,
  );
};

export const getCustomerById = async (id: string) => {
  return await httpClient.get<ICustomer>(`/customers/${id}`);
};

export const getCustomerLedger = async (id: string) => {
  return await httpClient.get<ICustomerLedger>(`/customers/${id}/ledger`);
};

export const createCustomer = async (payload: ICreateCustomerPayload) => {
  return await httpClient.post<ICustomer>("/customers", payload);
};

export const updateCustomer = async (id: string, payload: IUpdateCustomerPayload) => {
  return await httpClient.patch<ICustomer>(`/customers/${id}`, payload);
};

export const deleteCustomer = async (id: string) => {
  return await httpClient.delete<null>(`/customers/${id}`);
};

/* ------------------------------- collections ----------------------------- */

export const getDueReceipts = async (queryString?: string) => {
  return await httpClient.get<IDueReceivedListResponse>(
    `/due-received${queryString ? `?${queryString}` : ""}`,
  );
};

export const createDueReceipt = async (payload: ICreateDueReceivedPayload) => {
  return await httpClient.post<ICreateDueReceivedResponse>("/due-received", payload);
};

export const updateDueReceipt = async (id: string, payload: IUpdateDueReceivedPayload) => {
  return await httpClient.patch<IDueReceived>(`/due-received/${id}`, payload);
};

export const deleteDueReceipt = async (id: string) => {
  return await httpClient.delete<null>(`/due-received/${id}`);
};
