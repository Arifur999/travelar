"use server";

import { httpClient } from "@/lib/axios/httpClient";
import {
  type ICreateExpenseCategoryPayload,
  type ICreateExpensePayload,
  type IExpense,
  type IExpenseCategory,
  type IExpenseDashboard,
  type IExpensesListResponse,
  type IUpdateExpenseCategoryPayload,
  type IUpdateExpensePayload,
} from "@/types/expense.types";

/* ------------------------------- categories ------------------------------ */

/** Unpaginated — an agency has a handful of categories. */
export const getExpenseCategories = async () => {
  return await httpClient.get<IExpenseCategory[]>("/expenses/categories");
};

export const createExpenseCategory = async (payload: ICreateExpenseCategoryPayload) => {
  return await httpClient.post<IExpenseCategory>("/expenses/categories", payload);
};

export const updateExpenseCategory = async (
  id: string,
  payload: IUpdateExpenseCategoryPayload,
) => {
  return await httpClient.patch<IExpenseCategory>(`/expenses/categories/${id}`, payload);
};

export const deleteExpenseCategory = async (id: string) => {
  return await httpClient.delete<null>(`/expenses/categories/${id}`);
};

/* -------------------------------- expenses ------------------------------- */

export const getExpenses = async (queryString?: string) => {
  return await httpClient.get<IExpensesListResponse>(
    `/expenses${queryString ? `?${queryString}` : ""}`,
  );
};

/** Category breakdown with budget usage, plus month and year totals. */
export const getExpenseDashboard = async () => {
  return await httpClient.get<IExpenseDashboard>("/expenses/dashboard");
};

export const createExpense = async (payload: ICreateExpensePayload) => {
  return await httpClient.post<IExpense>("/expenses", payload);
};

export const updateExpense = async (id: string, payload: IUpdateExpensePayload) => {
  return await httpClient.patch<IExpense>(`/expenses/${id}`, payload);
};

export const deleteExpense = async (id: string) => {
  return await httpClient.delete<null>(`/expenses/${id}`);
};
