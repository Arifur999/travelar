/**
 * Where the money for an invoice payment comes from.
 *
 * Tickets, visa cases and Hajj bookings all take payment the same two ways:
 * cash arriving now, into an account, or what the customer paid in earlier and
 * the agency is still holding. The forms carry it as a string because a Select
 * does, and this turns that choice into what the API expects.
 */

/** The tuple, not just the union, so the zod schemas can enumerate it. */
export const PAYMENT_SOURCES = ["ACCOUNT", "WALLET"] as const;

export type PaymentSource = (typeof PAYMENT_SOURCES)[number];

export const PAYMENT_SOURCE_OPTIONS: { value: PaymentSource; label: string }[] = [
  { value: "ACCOUNT", label: "Money received now" },
  { value: "WALLET", label: "Customer balance" },
];

interface PaymentFormValues {
  source: PaymentSource;
  cashAccountId?: string;
}

/**
 * The account is dropped on a wallet payment rather than sent and ignored: no
 * money moves between accounts, so naming one would be a claim the API would
 * have to refuse. `fromWallet` is what tells it apart.
 */
export const toPaymentPayload = <T extends PaymentFormValues>(values: T) => {
  const fromWallet = values.source === "WALLET";

  return {
    ...values,
    cashAccountId: fromWallet ? undefined : values.cashAccountId,
    fromWallet,
  };
};

/**
 * The most this payment can be: never more than the invoice still owes, and on
 * a wallet payment never more than the customer has left.
 */
export const paymentCap = (due: number, source: PaymentSource, walletBalance: number) =>
  source === "WALLET" ? Math.min(due, walletBalance) : due;
