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
  try {
    return await httpClient.get<IExpenseCategory[]>("/expenses/categories");
  } catch (error) {
    console.error("Error fetching expense categories:", error);
    throw error;
  }
};

export const createExpenseCategory = async (payload: ICreateExpenseCategoryPayload) => {
  try {
    return await httpClient.post<IExpenseCategory>("/expenses/categories", payload);
  } catch (error) {
    console.error("Error creating expense category:", error);
    throw error;
  }
};

export const updateExpenseCategory = async (
  id: string,
  payload: IUpdateExpenseCategoryPayload,
) => {
  try {
    return await httpClient.patch<IExpenseCategory>(`/expenses/categories/${id}`, payload);
  } catch (error) {
    console.error("Error updating expense category:", error);
    throw error;
  }
};

export const deleteExpenseCategory = async (id: string) => {
  try {
    return await httpClient.delete<null>(`/expenses/categories/${id}`);
  } catch (error) {
    console.error("Error deleting expense category:", error);
    throw error;
  }
};

/* -------------------------------- expenses ------------------------------- */

export const getExpenses = async (queryString?: string) => {
  try {
    return await httpClient.get<IExpensesListResponse>(
      `/expenses${queryString ? `?${queryString}` : ""}`,
    );
  } catch (error) {
    console.error("Error fetching expenses:", error);
    throw error;
  }
};

/** Category breakdown with budget usage, plus month and year totals. */
export const getExpenseDashboard = async () => {
  try {
    return await httpClient.get<IExpenseDashboard>("/expenses/dashboard");
  } catch (error) {
    console.error("Error fetching expense dashboard:", error);
    throw error;
  }
};

export const createExpense = async (payload: ICreateExpensePayload) => {
  try {
    return await httpClient.post<IExpense>("/expenses", payload);
  } catch (error) {
    console.error("Error creating expense:", error);
    throw error;
  }
};

export const updateExpense = async (id: string, payload: IUpdateExpensePayload) => {
  try {
    return await httpClient.patch<IExpense>(`/expenses/${id}`, payload);
  } catch (error) {
    console.error("Error updating expense:", error);
    throw error;
  }
};

export const deleteExpense = async (id: string) => {
  try {
    return await httpClient.delete<null>(`/expenses/${id}`);
  } catch (error) {
    console.error("Error deleting expense:", error);
    throw error;
  }
};
