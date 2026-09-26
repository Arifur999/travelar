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

/**
 * Where to send a bKash payment.
 *
 * `available` is false when the platform has no bKash number configured — the
 * screen says so rather than asking somebody to send money to nowhere.
 */
export interface IManualPaymentInfo {
  number: string;
  /** The operator has uploaded a QR. The image itself comes from /api/bkash-qr. */
  hasQr: boolean;
  available: boolean;
}

/** A bKash payment the agency has claimed and an operator has not read yet. */
export interface IPendingManualPayment {
  id: string;
  planName: string;
  amount: number;
  senderNumber: string | null;
  senderReference: string | null;
  createdAt: string;
}

/** What comes back from claiming one. Nothing is paid for yet. */
export interface IManualPaymentReceipt {
  id: string;
  status: "PENDING";
  planName: string;
  amount: number;
  senderReference: string | null;
  createdAt: string;
}

/** The operator's view of where subscription money is sent. */
export interface IPaymentSettings {
  bkashNumber: string;
  hasQr: boolean;
  qrSetAt: string | null;
  updatedAt: string | null;
}

/** One bKash claim waiting for somebody to read a receipt. */
export interface IManualPaymentForReview {
  id: string;
  status: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED";
  amount: number;
  senderNumber: string | null;
  senderReference: string | null;
  createdAt: string;
  reviewedAt: string | null;
  reviewNote: string | null;
  plan: { id: string; name: string; durationDays: number };
  agency: { id: string; name: string; phone: string | null; email: string | null };
}
