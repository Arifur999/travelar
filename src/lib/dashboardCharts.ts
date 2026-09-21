import {
  MONTH_NAMES,
  type ICashFlowAccount,
  type IModuleBreakdown,
  type ITrendMonth,
} from "@/types/dashboard.types";

/**
 * Shapes the landing summary into what the dashboard charts draw.
 *
 * Kept free of React so the decisions that are easy to get subtly wrong — what
 * counts as "no data yet", how a sixth account is folded away, a slice that is
 * zero — have unit tests.
 */

export type TrendMetric = "sales" | "profit" | "expenses";

export interface TrendPoint {
  /** Short axis label: "Apr", or "Jan 27" where the window crosses a year. */
  label: string;
  /** Tooltip label: "April 2026". */
  fullLabel: string;
  sales: number;
  profit: number;
  expenses: number;
  isCurrent: boolean;
}

export const buildTrendPoints = (trend: ITrendMonth[]): TrendPoint[] => {
  const crossesYear = new Set(trend.map((m) => m.year)).size > 1;

  return trend.map((m, index) => {
    const name = MONTH_NAMES[m.month - 1] ?? String(m.month);
    const short = name.slice(0, 3);
    // Only January carries the year, and only when the window spans two —
    // enough to read the boundary without cluttering every label.
    const label = crossesYear && m.month === 1 ? `${short} ${String(m.year).slice(-2)}` : short;

    return {
      label,
      fullLabel: `${name} ${m.year}`,
      sales: m.sales,
      profit: m.profit,
      expenses: m.expenses,
      isCurrent: index === trend.length - 1,
    };
  });
};

/** True when the window holds nothing at all to draw for this metric. */
export const isTrendEmpty = (trend: ITrendMonth[], metric: TrendMetric) =>
  trend.every((m) => m[metric] === 0);

/**
 * Change from last month to this one, as a percentage — or null when there is
 * no fair comparison. The current month is still in progress, so this is
 * labelled "so far" wherever it is shown.
 */
export const monthOverMonth = (trend: ITrendMonth[], metric: TrendMetric): number | null => {
  if (trend.length < 2) return null;
  const previous = trend[trend.length - 2][metric];
  const current = trend[trend.length - 1][metric];
  // From zero, any change is infinite; saying "+∞%" helps nobody.
  if (previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
};

export type SalesModule = "ticketing" | "visa" | "hajj";

export interface SalesSlice {
  module: SalesModule;
  label: string;
  value: number;
  count: number;
  /** 0–100. */
  share: number;
}

const MODULE_LABELS: Record<SalesModule, string> = {
  ticketing: "Tickets",
  visa: "Visa",
  hajj: "Hajj & Umrah",
};

/**
 * One slice per module that actually sold something. A zero slice is dropped
 * rather than drawn as a hairline, and refunds can in principle push a module
 * below zero — a pie cannot show that, so it is left out of the pie too.
 */
export const buildSalesMix = (byModule: IModuleBreakdown): SalesSlice[] => {
  const modules: SalesModule[] = ["ticketing", "visa", "hajj"];
  const positive = modules
    .map((module) => ({ module, value: byModule[module].sales, count: byModule[module].count }))
    .filter((row) => row.value > 0);

  const total = positive.reduce((sum, row) => sum + row.value, 0);

  return positive.map((row) => ({
    ...row,
    label: MODULE_LABELS[row.module],
    share: total > 0 ? (row.value / total) * 100 : 0,
  }));
};

export interface AccountBar {
  key: string;
  name: string;
  balance: number;
  isNegative: boolean;
  /** How many accounts this bar stands for; more than 1 only for "Other accounts". */
  accounts: number;
}

/**
 * At most `limit` bars: the largest accounts by balance, with the rest folded
 * into one "Other accounts" bar, so the chart stays readable for an agency with
 * twenty accounts.
 *
 * An overdrawn account is always shown on its own, even past the limit: a
 * negative balance is the thing most worth seeing, and adding it into "Other
 * accounts" would hide it inside a positive total.
 *
 * Folding only happens when it removes at least two bars — "Other accounts (1)"
 * is just an account with a worse name.
 */
export const buildAccountBars = (accounts: ICashFlowAccount[], limit = 5): AccountBar[] => {
  const sorted = [...accounts].sort((a, b) => b.balance - a.balance);
  const overdrawn = sorted.filter((a) => a.balance < 0);
  const positive = sorted.filter((a) => a.balance >= 0);

  const room = limit - overdrawn.length;

  let shownCount: number;
  if (positive.length <= Math.max(room, 1)) {
    // Everything fits, or there is exactly one account left to place.
    shownCount = positive.length;
  } else {
    // One slot goes to the "Other" bar. With no room at all, fold everything.
    shownCount = Math.max(room - 1, 0);
  }

  const shown = positive.slice(0, shownCount);
  const rest = positive.slice(shownCount);

  const toBar = (a: ICashFlowAccount): AccountBar => ({
    key: a.id,
    name: a.isActive ? a.name : `${a.name} (inactive)`,
    balance: a.balance,
    isNegative: a.balance < 0,
    accounts: 1,
  });

  const bars = shown.map(toBar);

  if (rest.length > 0) {
    bars.push({
      key: "other",
      name: `Other accounts (${rest.length})`,
      balance: rest.reduce((sum, a) => sum + a.balance, 0),
      isNegative: false,
      accounts: rest.length,
    });
  }

  return [...bars, ...overdrawn.map(toBar)];
};

