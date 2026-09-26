"use server";

import { httpClient } from "@/lib/axios/httpClient";
import {
  type IManualPaymentForReview,
  type IPaymentSettings,
} from "@/types/billing.types";
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

/**
 * Where subscription money is sent, and the bKash claims waiting on it.
 *
 * SUPER_ADMIN only on the API: approving one of these grants a paid plan, so
 * it is the platform operator who does it and nobody inside an agency.
 */
export const getPaymentSettings = async () => {
  return await httpClient.get<IPaymentSettings>("/admin/payment-settings");
};

export const updatePaymentSettings = async (payload: { bkashNumber: string }) => {
  return await httpClient.patch<IPaymentSettings>("/admin/payment-settings", payload);
};

export const uploadPaymentQr = async (formData: FormData) => {
  return await httpClient.postFormData<IPaymentSettings>(
    "/admin/payment-settings/qr",
    formData,
  );
};

export const getManualPayments = async (statusFilter?: string) => {
  return await httpClient.get<IManualPaymentForReview[]>(
    statusFilter
      ? `/admin/manual-payments?status=${encodeURIComponent(statusFilter)}`
      : "/admin/manual-payments",
  );
};

/** Approving renews the plan there and then; refusing frees the agency to retry. */
export const reviewManualPayment = async (
  id: string,
  payload: { approve: boolean; note?: string },
) => {
  return await httpClient.post<{ id: string; approved: boolean }>(
    `/admin/manual-payments/${encodeURIComponent(id)}/review`,
    payload,
  );
};
