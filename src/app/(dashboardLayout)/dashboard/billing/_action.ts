"use server";

import { getActionErrorMessage } from "@/lib/actionError";
import {
  retryOrder,
  startCheckout,
  submitManualPayment,
} from "@/services/billing.services";
import { type ApiErrorResponse, type ApiResponse } from "@/types/api.types";
import {
  type ICheckoutSession,
  type IManualPaymentReceipt,
} from "@/types/billing.types";

/**
 * Both actions are AGENCY_ADMIN on the API. Neither completes a payment — they
 * open a gateway session and hand back a URL. The order is only ever marked
 * paid by the IPN callback, server-to-server, so nothing the browser does after
 * this point can mark a subscription active.
 */
export const startCheckoutAction = async (
  planId: string,
): Promise<ApiResponse<ICheckoutSession> | ApiErrorResponse> => {
  if (!planId) return { success: false, message: "Pick a plan first" };

  try {
    return await startCheckout(planId);
  } catch (error: unknown) {
    // A gateway refusal comes back with the reason SSLCommerz gave, which is
    // far more useful than a generic failure — bad store credentials, for
    // instance, say exactly that.
    return { success: false, message: getActionErrorMessage(error, "Could not start checkout") };
  }
};

export const retryOrderAction = async (
  transactionId: string,
): Promise<ApiResponse<ICheckoutSession> | ApiErrorResponse> => {
  if (!transactionId) return { success: false, message: "Invalid transaction" };

  try {
    // Cancels the prior attempt first, so a retry cannot double-charge.
    return await retryOrder(transactionId);
  } catch (error: unknown) {
    return { success: false, message: getActionErrorMessage(error, "Could not retry payment") };
  }
};

/**
 * Tells the API the agency has paid by bKash.
 *
 * Like the two above, this completes nothing. It records a claim; an operator
 * reading their bKash statement is what turns a plan on, so nothing the
 * browser sends here can activate a subscription.
 */
export const submitManualPaymentAction = async (input: {
  planId: string;
  senderNumber: string;
  senderReference: string;
}): Promise<ApiResponse<IManualPaymentReceipt> | ApiErrorResponse> => {
  if (!input.planId) return { success: false, message: "Pick a plan first" };

  try {
    return await submitManualPayment(input);
  } catch (error: unknown) {
    // The API's own words are what matter here: a reused transaction id and a
    // claim already waiting both say something the payer can act on.
    return {
      success: false,
      message: getActionErrorMessage(error, "Could not send your bKash payment"),
    };
  }
};
