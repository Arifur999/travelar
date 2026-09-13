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
  try {
    return await httpClient.get<IEmployeesListResponse>(
      `/employees${queryString ? `?${queryString}` : ""}`,
    );
  } catch (error) {
    console.error("Error fetching employees:", error);
    throw error;
  }
};

/** Whole-book payout totals, unpaginated. */
export const getEmployeeDashboard = async () => {
  try {
    return await httpClient.get<IEmployeeDashboard>("/employees/dashboard");
  } catch (error) {
    console.error("Error fetching employee dashboard:", error);
    throw error;
  }
};

export const createEmployee = async (payload: ICreateEmployeePayload) => {
  try {
    return await httpClient.post<IEmployee>("/employees", payload);
  } catch (error) {
    console.error("Error creating employee:", error);
    throw error;
  }
};

export const updateEmployee = async (id: string, payload: IUpdateEmployeePayload) => {
  try {
    return await httpClient.patch<IEmployee>(`/employees/${id}`, payload);
  } catch (error) {
    console.error("Error updating employee:", error);
    throw error;
  }
};

export const deleteEmployee = async (id: string) => {
  try {
    return await httpClient.delete<null>(`/employees/${id}`);
  } catch (error) {
    console.error("Error deleting employee:", error);
    throw error;
  }
};

/* --------------------------------- payouts ------------------------------- */

export const getEmployeeTransactions = async (queryString?: string) => {
  try {
    return await httpClient.get<IEmployeeTransactionsListResponse>(
      `/employees/transactions${queryString ? `?${queryString}` : ""}`,
    );
  } catch (error) {
    console.error("Error fetching employee payouts:", error);
    throw error;
  }
};

export const createEmployeeTransaction = async (
  payload: ICreateEmployeeTransactionPayload,
) => {
  try {
    return await httpClient.post<IEmployeeTransaction>("/employees/transactions", payload);
  } catch (error) {
    console.error("Error recording employee payout:", error);
    throw error;
  }
};

/** AGENCY_ADMIN only — reversing a posted payout moves an account balance. */
export const deleteEmployeeTransaction = async (id: string) => {
  try {
    return await httpClient.delete<null>(`/employees/transactions/${id}`);
  } catch (error) {
    console.error("Error deleting employee payout:", error);
    throw error;
  }
};

/* ------------------------------- attendance ------------------------------ */

export const getAttendance = async (queryString?: string) => {
  try {
    return await httpClient.get<IEmployeeAttendance[]>(
      `/employees/attendance${queryString ? `?${queryString}` : ""}`,
    );
  } catch (error) {
    console.error("Error fetching attendance:", error);
    throw error;
  }
};

export const getAttendanceSummary = async (queryString?: string) => {
  try {
    return await httpClient.get<IAttendanceSummary>(
      `/employees/attendance/summary${queryString ? `?${queryString}` : ""}`,
    );
  } catch (error) {
    console.error("Error fetching attendance summary:", error);
    throw error;
  }
};

export const createAttendance = async (payload: ICreateAttendancePayload) => {
  try {
    return await httpClient.post<IEmployeeAttendance>("/employees/attendance", payload);
  } catch (error) {
    console.error("Error recording attendance:", error);
    throw error;
  }
};

export const deleteAttendance = async (id: string) => {
  try {
    return await httpClient.delete<null>(`/employees/attendance/${id}`);
  } catch (error) {
    console.error("Error deleting attendance:", error);
    throw error;
  }
};
