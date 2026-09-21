import { type IWalletHolder } from "@/types/wallet.types";

/**
 * Shapes the wallet list into what its chart draws. Kept free of React so the
 * awkward parts — a long tail of small balances, names that repeat — have
 * unit tests.
 */

export interface WalletBar {
  customerId: string;
  /** Chart label: the customer's name, shortened if it would not fit. */
  label: string;
  balance: number;
}

export interface WalletBars {
  bars: WalletBar[];
  /** Customers in credit that the chart does not draw. */
  hiddenCount: number;
  hiddenTotal: number;
}

const shorten = (name: string, maxLength = 18) =>
  name.length > maxLength ? `${name.slice(0, maxLength - 1).trimEnd()}…` : name;

/**
 * The biggest balances, largest first.
 *
 * The tail is counted rather than folded into an "Other" bar: every bar here
 * stands for one customer the agency can call, and a bar standing for thirty
 * of them would be read as a person. The count is reported separately so the
 * card can say what is missing.
 */
export const buildWalletBars = (holders: IWalletHolder[], limit = 8): WalletBars => {
  const inCredit = holders.filter((holder) => holder.balance > 0);
  const sorted = [...inCredit].sort(
    (a, b) => b.balance - a.balance || a.name.localeCompare(b.name),
  );
  const shown = sorted.slice(0, limit);
  const hidden = sorted.slice(limit);

  return {
    bars: shown.map((holder) => ({
      customerId: holder.customerId,
      label: shorten(holder.name),
      balance: holder.balance,
    })),
    hiddenCount: hidden.length,
    hiddenTotal: hidden.reduce((sum, holder) => sum + holder.balance, 0),
  };
};

/**
 * How much of what a customer paid in is still unspent, 0–100.
 *
 * Returns null when they have paid in nothing, because "0% used" and "nothing
 * to use" are different things and only one of them is worth a progress bar.
 */
export const unspentShare = (holder: IWalletHolder): number | null => {
  if (holder.paidIn <= 0) return null;
  return Math.max(0, Math.min(100, (holder.balance / holder.paidIn) * 100));
};
