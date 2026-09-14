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
  type IPlatformStats,
  type IUpdateAgencyStatusPayload,
} from "@/types/admin.types";

/** Every route here is SUPER_ADMIN only — the operator console, not a tenant's. */

/* --------------------------------- plans --------------------------------- */

export const getAdminPlans = async () => {
  try {
    return await httpClient.get<IAdminPlan[]>("/admin/plans");
  } catch (error) {
    console.error("Error fetching plans:", error);
    throw error;
  }
};

export const createPlan = async (payload: ICreatePlanPayload) => {
  try {
    return await httpClient.post<IAdminPlan>("/admin/plans", payload);
  } catch (error) {
    console.error("Error creating plan:", error);
    throw error;
  }
};

export const updatePlan = async (id: string, payload: Partial<ICreatePlanPayload>) => {
  try {
    return await httpClient.patch<IAdminPlan>(`/admin/plans/${id}`, payload);
  } catch (error) {
    console.error("Error updating plan:", error);
    throw error;
  }
};

/** Deactivates rather than removes — agencies on the plan keep working. */
export const deactivatePlan = async (id: string) => {
  try {
    return await httpClient.delete<null>(`/admin/plans/${id}`);
  } catch (error) {
    console.error("Error deactivating plan:", error);
    throw error;
  }
};

/* -------------------------------- agencies ------------------------------- */

export const getAgencies = async (queryString?: string) => {
  try {
    return await httpClient.get<IAdminAgency[]>(
      `/admin/agencies${queryString ? `?${queryString}` : ""}`,
    );
  } catch (error) {
    console.error("Error fetching agencies:", error);
    throw error;
  }
};

export const getAgencyById = async (id: string) => {
  try {
    return await httpClient.get<IAdminAgencyDetail>(`/admin/agencies/${id}`);
  } catch (error) {
    console.error("Error fetching agency:", error);
    throw error;
  }
};

export const updateAgencyStatus = async (
  id: string,
  payload: IUpdateAgencyStatusPayload,
) => {
  try {
    return await httpClient.patch<null>(`/admin/agencies/${id}/status`, payload);
  } catch (error) {
    console.error("Error updating agency status:", error);
    throw error;
  }
};

/**
 * Assigning by hand uses the same stacking renewal as a payment, so the two
 * paths cannot disagree about what a subscription end date means.
 */
export const assignPlan = async (id: string, payload: IAssignPlanPayload) => {
  try {
    return await httpClient.patch<null>(`/admin/agencies/${id}/plan`, payload);
  } catch (error) {
    console.error("Error assigning plan:", error);
    throw error;
  }
};

export const extendTrial = async (id: string, payload: IExtendTrialPayload) => {
  try {
    return await httpClient.patch<null>(`/admin/agencies/${id}/extend-trial`, payload);
  } catch (error) {
    console.error("Error extending trial:", error);
    throw error;
  }
};

export const deleteAgency = async (id: string) => {
  try {
    return await httpClient.delete<null>(`/admin/agencies/${id}`);
  } catch (error) {
    console.error("Error deleting agency:", error);
    throw error;
  }
};

/* ---------------------------- stats and audit ---------------------------- */

export const getPlatformStats = async () => {
  try {
    return await httpClient.get<IPlatformStats>("/admin/stats");
  } catch (error) {
    console.error("Error fetching platform stats:", error);
    throw error;
  }
};

export const getActivityLog = async (queryString?: string) => {
  try {
    return await httpClient.get<IActivityLogEntry[]>(
      `/admin/activity-log${queryString ? `?${queryString}` : ""}`,
    );
  } catch (error) {
    console.error("Error fetching activity log:", error);
    throw error;
  }
};
