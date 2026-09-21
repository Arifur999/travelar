"use server";

import { httpClient } from "@/lib/axios/httpClient";
import {
  type ICashFlow,
  type IDashboardOverview,
  type IDashboardSummary,
  type IMonthlyOverview,
  type IYearlyOverview,
} from "@/types/dashboard.types";

/**
 * Only `/summary` is a base feature. The analytical views below sit behind the
 * REPORTS plan feature, so an agency without it gets a 403 with the reason
 * rather than an empty page.
 */

export const getDashboardSummary = async () => {
  return await httpClient.get<IDashboardSummary>("/dashboard/summary");
};

/** Any date range — the spreadsheet's Custom Dashboard. Defaults to this month. */
export const getCustomDashboard = async (from?: string, to?: string) => {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const query = params.toString();

  return await httpClient.get<IDashboardOverview>(
    `/dashboard/custom${query ? `?${query}` : ""}`,
  );
};

export const getMonthlyDashboard = async (year?: number, month?: number) => {
  const params = new URLSearchParams();
  if (year) params.set("year", String(year));
  if (month) params.set("month", String(month));
  const query = params.toString();

  return await httpClient.get<IMonthlyOverview>(
    `/dashboard/monthly${query ? `?${query}` : ""}`,
  );
};

export const getYearlyDashboard = async (year?: number) => {
  return await httpClient.get<IYearlyOverview>(
    `/dashboard/yearly${year ? `?year=${year}` : ""}`,
  );
};

export const getCashFlow = async () => {
  return await httpClient.get<ICashFlow>("/dashboard/cash-flow");
};

