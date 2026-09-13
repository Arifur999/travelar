import { type AgencyStatus, type SubscriptionOrderStatus } from "./enums.types";
import { type IPlan } from "./user.types";

/**
 * The agency's own subscription state.
 *
 * `trialDaysLeft` and `subscriptionDaysLeft` are floored at zero by the API, so
 * a lapsed trial reports 0 rather than a negative number.
 */
export interface IMySubscription {
  status: AgencyStatus;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
  trialDaysLeft: number;
  subscriptionDaysLeft: number;
  /** null while the agency is still on trial with no plan assigned. */
  plan: IPlan | null;
}

/**
 * One row of the billing history, merged from two sources: online orders
 * through the gateway and payments an admin recorded by hand.
 */
export interface IPaymentHistoryRow {
  id: string;
  source: "online" | "manual";
  date: string;
  planName: string | null;
  amount: number;
  /** Manual rows are always "SUCCESS" — they are only written once taken. */
  status: SubscriptionOrderStatus | "SUCCESS";
  method: string;
  reference: string | null;
}

/** What POST /billing/checkout returns — where to send the browser, and the id to poll. */
export interface ICheckoutSession {
  gatewayUrl: string;
  transactionId: string;
}

export interface ISubscriptionOrder {
  id: string;
  agencyId: string;
  planId: string;
  transactionId: string;
  amount: number;
  currency: string;
  status: SubscriptionOrderStatus;
  paymentMethod?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ICheckoutPayload {
  planId: string;
}
