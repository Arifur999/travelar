"use server";

import { httpClient } from "@/lib/axios/httpClient";
import {
  type ICashFlow,
  type IDashboardOverview,
  type IDashboardSummary,
  type IMonthlyGoal,
  type IMonthlyOverview,
  type IUpsertGoalPayload,
  type IYearlyOverview,
} from "@/types/dashboard.types";

/**
 * Only `/summary` and `/goals` are base features. The analytical views below
 * sit behind the REPORTS plan feature, so an agency without it gets a 403 with
 * the reason rather than an empty page.
 */

export const getDashboardSummary = async () => {
  try {
    return await httpClient.get<IDashboardSummary>("/dashboard/summary");
  } catch (error) {
    console.error("Error fetching dashboard summary:", error);
    throw error;
  }
};

/** Any date range — the spreadsheet's Custom Dashboard. Defaults to this month. */
export const getCustomDashboard = async (from?: string, to?: string) => {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const query = params.toString();

  try {
    return await httpClient.get<IDashboardOverview>(
      `/dashboard/custom${query ? `?${query}` : ""}`,
    );
  } catch (error) {
    console.error("Error fetching custom dashboard:", error);
    throw error;
  }
};

export const getMonthlyDashboard = async (year?: number, month?: number) => {
  const params = new URLSearchParams();
  if (year) params.set("year", String(year));
  if (month) params.set("month", String(month));
  const query = params.toString();

  try {
    return await httpClient.get<IMonthlyOverview>(
      `/dashboard/monthly${query ? `?${query}` : ""}`,
    );
  } catch (error) {
    console.error("Error fetching monthly dashboard:", error);
    throw error;
  }
};

export const getYearlyDashboard = async (year?: number) => {
  try {
    return await httpClient.get<IYearlyOverview>(
      `/dashboard/yearly${year ? `?year=${year}` : ""}`,
    );
  } catch (error) {
    console.error("Error fetching yearly dashboard:", error);
    throw error;
  }
};

export const getCashFlow = async () => {
  try {
    return await httpClient.get<ICashFlow>("/dashboard/cash-flow");
  } catch (error) {
    console.error("Error fetching cash flow:", error);
    throw error;
  }
};

/* ---------------------------------- goals -------------------------------- */

export const getGoals = async (year?: number) => {
  try {
    return await httpClient.get<IMonthlyGoal[]>(
      `/dashboard/goals${year ? `?year=${year}` : ""}`,
    );
  } catch (error) {
    console.error("Error fetching goals:", error);
    throw error;
  }
};

/** AGENCY_ADMIN only on the API — staff can read goals but not set them. */
export const upsertGoal = async (payload: IUpsertGoalPayload) => {
  try {
    return await httpClient.post<IMonthlyGoal>("/dashboard/goals", payload);
  } catch (error) {
    console.error("Error saving goal:", error);
    throw error;
  }
};
