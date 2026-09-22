/**
 * Who owes the most, or is owed the most — the one chart a customer or
 * supplier dashboard needs.
 *
 * Kept free of React, and shared by both, because the awkward parts are the
 * same on either side: a long tail of small balances, names too long for a
 * tick, and balances on the wrong side of zero.
 */

export interface BalanceRow {
  id: string;
  name: string;
  /** Positive means owing. A negative balance is credit, and is left out. */
  balance: number;
}

export interface BalanceBar {
  id: string;
  /** Chart label: the name, shortened if it would not fit a tick. */
  label: string;
  balance: number;
}

export interface BalanceBars {
  bars: BalanceBar[];
  /** Rows with a balance that the chart does not draw. */
  hiddenCount: number;
  hiddenTotal: number;
}

const shorten = (name: string, maxLength = 18) =>
  name.length > maxLength ? `${name.slice(0, maxLength - 1).trimEnd()}…` : name;

/**
 * The biggest balances, largest first.
 *
 * The tail is counted rather than folded into an "Other" bar: every bar here
 * stands for somebody the agency can call, and a bar standing for thirty of
 * them would be read as a person.
 *
 * Anyone in credit is left out. A pie or a bar cannot show a negative without
 * lying about the scale, and "who owes us" is the question being asked.
 */
export const buildBalanceBars = (rows: BalanceRow[], limit = 8): BalanceBars => {
  const owing = rows.filter((row) => row.balance > 0);
  const sorted = [...owing].sort(
    (a, b) => b.balance - a.balance || a.name.localeCompare(b.name),
  );

  const shown = sorted.slice(0, limit);
  const hidden = sorted.slice(limit);

  return {
    bars: shown.map((row) => ({ id: row.id, label: shorten(row.name), balance: row.balance })),
    hiddenCount: hidden.length,
    hiddenTotal: hidden.reduce((sum, row) => sum + row.balance, 0),
  };
};

/**
 * How much of what was billed has been collected, 0–100.
 *
 * Returns null when nothing has been billed: "0% collected" reads like a
 * problem, and having sold nothing yet is not one.
 */
export const collectedShare = (billed: number, collected: number): number | null => {
  if (billed <= 0) return null;
  return Math.max(0, Math.min(100, (collected / billed) * 100));
};
