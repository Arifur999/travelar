"use server";

import { httpClient } from "@/lib/axios/httpClient";
import {
  type ICheckoutSession,
  type IMySubscription,
  type IPaymentHistoryRow,
  type ISubscriptionOrder,
} from "@/types/billing.types";
import { type IPlan } from "@/types/user.types";

/**
 * Billing is never gated on a plan or an expiry — an agency that has lapsed
 * must still be able to see what it owes and pay for it. That is why none of
 * these calls sit behind checkFeatureAccess.
 */

export const getAvailablePlans = async () => {
  try {
    return await httpClient.get<IPlan[]>("/billing/plans");
  } catch (error) {
    console.error("Error fetching plans:", error);
    throw error;
  }
};

export const getMySubscription = async () => {
  try {
    return await httpClient.get<IMySubscription>("/billing/my-subscription");
  } catch (error) {
    console.error("Error fetching subscription:", error);
    throw error;
  }
};

/** Online orders and manually recorded payments, merged and sorted by date. */
export const getPaymentHistory = async () => {
  try {
    return await httpClient.get<IPaymentHistoryRow[]>("/billing/payment-history");
  } catch (error) {
    console.error("Error fetching payment history:", error);
    throw error;
  }
};

export const getOrderStatus = async (transactionId: string) => {
  try {
    return await httpClient.get<ISubscriptionOrder>(
      `/billing/orders/${encodeURIComponent(transactionId)}/status`,
    );
  } catch (error) {
    console.error("Error fetching order status:", error);
    throw error;
  }
};

/** AGENCY_ADMIN only. Returns where to send the browser. */
export const startCheckout = async (planId: string) => {
  try {
    return await httpClient.post<ICheckoutSession>("/billing/checkout", { planId });
  } catch (error) {
    console.error("Error starting checkout:", error);
    throw error;
  }
};

/**
 * AGENCY_ADMIN only. Retrying cancels the previous attempt before opening a new
 * one, so the two cannot both succeed and renew the subscription twice — which
 * is what the implementation this replaces allowed.
 */
export const retryOrder = async (transactionId: string) => {
  try {
    return await httpClient.post<ICheckoutSession>(
      `/billing/orders/${encodeURIComponent(transactionId)}/retry`,
    );
  } catch (error) {
    console.error("Error retrying order:", error);
    throw error;
  }
};
