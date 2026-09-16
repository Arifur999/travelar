"use server";

import { httpClient } from "@/lib/axios/httpClient";
import {
  type IActivityLogEntry,
  type IAdminAgency,
  type IAdminAgencyDetail,
  type IAdminPlan,
  type IAssignPlanPayload,
  type ICreatePlanPayload,
  type IExtendTrialPayload,
  type ILifecycleRunSummary,
  type IPlatformStats,
  type IUpdateAgencyStatusPayload,
} from "@/types/admin.types";

/** Every route here is SUPER_ADMIN only — the operator console, not a tenant's. */

/* --------------------------------- plans --------------------------------- */

export const getAdminPlans = async () => {
  return await httpClient.get<IAdminPlan[]>("/admin/plans");
};

export const createPlan = async (payload: ICreatePlanPayload) => {
  return await httpClient.post<IAdminPlan>("/admin/plans", payload);
};

export const updatePlan = async (id: string, payload: Partial<ICreatePlanPayload>) => {
  return await httpClient.patch<IAdminPlan>(`/admin/plans/${id}`, payload);
};

/** Deactivates rather than removes — agencies on the plan keep working. */
export const deactivatePlan = async (id: string) => {
  return await httpClient.delete<null>(`/admin/plans/${id}`);
};

/* -------------------------------- agencies ------------------------------- */

export const getAgencies = async (queryString?: string) => {
  return await httpClient.get<IAdminAgency[]>(
    `/admin/agencies${queryString ? `?${queryString}` : ""}`,
  );
};

export const getAgencyById = async (id: string) => {
  return await httpClient.get<IAdminAgencyDetail>(`/admin/agencies/${id}`);
};

export const updateAgencyStatus = async (
  id: string,
  payload: IUpdateAgencyStatusPayload,
) => {
  return await httpClient.patch<null>(`/admin/agencies/${id}/status`, payload);
};

/**
 * Assigning by hand uses the same stacking renewal as a payment, so the two
 * paths cannot disagree about what a subscription end date means.
 */
export const assignPlan = async (id: string, payload: IAssignPlanPayload) => {
  return await httpClient.patch<null>(`/admin/agencies/${id}/plan`, payload);
};

export const extendTrial = async (id: string, payload: IExtendTrialPayload) => {
  return await httpClient.patch<null>(`/admin/agencies/${id}/extend-trial`, payload);
};

export const deleteAgency = async (id: string) => {
  return await httpClient.delete<null>(`/admin/agencies/${id}`);
};

/* ---------------------------------- jobs --------------------------------- */

export const runSubscriptionLifecycle = async () => {
  return await httpClient.post<ILifecycleRunSummary>("/admin/jobs/subscription-lifecycle", {});
};

/* ---------------------------- stats and audit ---------------------------- */

export const getPlatformStats = async () => {
  return await httpClient.get<IPlatformStats>("/admin/stats");
};

export const getActivityLog = async (queryString?: string) => {
  return await httpClient.get<IActivityLogEntry[]>(
    `/admin/activity-log${queryString ? `?${queryString}` : ""}`,
  );
};
