"use server";

import { httpClient } from "@/lib/axios/httpClient";
import {
  type IAttendanceSummary,
  type ICreateAttendancePayload,
  type ICreateEmployeePayload,
  type ICreateEmployeeTransactionPayload,
  type IEmployee,
  type IEmployeeAttendance,
  type IEmployeeDashboard,
  type IEmployeesListResponse,
  type IEmployeeTransaction,
  type IEmployeeTransactionsListResponse,
  type IUpdateEmployeePayload,
} from "@/types/employee.types";

/* -------------------------------- employees ------------------------------ */

export const getEmployees = async (queryString?: string) => {
  return await httpClient.get<IEmployeesListResponse>(
    `/employees${queryString ? `?${queryString}` : ""}`,
  );
};

/** Whole-book payout totals, unpaginated. */
export const getEmployeeDashboard = async () => {
  return await httpClient.get<IEmployeeDashboard>("/employees/dashboard");
};

export const createEmployee = async (payload: ICreateEmployeePayload) => {
  return await httpClient.post<IEmployee>("/employees", payload);
};

export const updateEmployee = async (id: string, payload: IUpdateEmployeePayload) => {
  return await httpClient.patch<IEmployee>(`/employees/${id}`, payload);
};

export const deleteEmployee = async (id: string) => {
  return await httpClient.delete<null>(`/employees/${id}`);
};

/* --------------------------------- payouts ------------------------------- */

export const getEmployeeTransactions = async (queryString?: string) => {
  return await httpClient.get<IEmployeeTransactionsListResponse>(
    `/employees/transactions${queryString ? `?${queryString}` : ""}`,
  );
};

export const createEmployeeTransaction = async (
  payload: ICreateEmployeeTransactionPayload,
) => {
  return await httpClient.post<IEmployeeTransaction>("/employees/transactions", payload);
};

/** AGENCY_ADMIN only — reversing a posted payout moves an account balance. */
export const deleteEmployeeTransaction = async (id: string) => {
  return await httpClient.delete<null>(`/employees/transactions/${id}`);
};

/* ------------------------------- attendance ------------------------------ */

export const getAttendance = async (queryString?: string) => {
  return await httpClient.get<IEmployeeAttendance[]>(
    `/employees/attendance${queryString ? `?${queryString}` : ""}`,
  );
};

export const getAttendanceSummary = async (queryString?: string) => {
  return await httpClient.get<IAttendanceSummary>(
    `/employees/attendance/summary${queryString ? `?${queryString}` : ""}`,
  );
};

export const createAttendance = async (payload: ICreateAttendancePayload) => {
  return await httpClient.post<IEmployeeAttendance>("/employees/attendance", payload);
};

export const deleteAttendance = async (id: string) => {
  return await httpClient.delete<null>(`/employees/attendance/${id}`);
};
