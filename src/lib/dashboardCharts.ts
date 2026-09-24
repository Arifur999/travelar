import {
  MONTH_NAMES,
  type ICashFlow,
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
 * One month against the one before it, as a percentage — or null when there is
 * no fair comparison. From zero, any change is infinite, and "+∞%" helps
 * nobody.
 */
const changeBetween = (previous: number, current: number): number | null =>
  previous === 0 ? null : ((current - previous) / Math.abs(previous)) * 100;

/**
 * Change from last month to this one, as a percentage — or null when there is
 * no fair comparison. The current month is still in progress, so this is
 * labelled "so far" wherever it is shown.
 */
export const monthOverMonth = (trend: ITrendMonth[], metric: TrendMetric): number | null => {
  if (trend.length < 2) return null;
  return changeBetween(trend[trend.length - 2][metric], trend[trend.length - 1][metric]);
};

export interface TrendHighlight {
  /** "April 2026". */
  label: string;
  value: number;
  /** Against the month before this one; null where there isn't one. */
  change: number | null;
  /** True for the month still in progress. */
  isCurrent: boolean;
}

/**
 * The two figures printed beside the chart: this month and the one before it,
 * newest first.
 *
 * Built from the points rather than the raw months so the month names are
 * formatted in exactly one place — the axis and these blocks disagreeing about
 * what "Jan" means across a year boundary is the bug this avoids.
 */
export const buildTrendHighlights = (
  points: TrendPoint[],
  metric: TrendMetric,
): TrendHighlight[] => {
  const last = points.length - 1;
  return [last, last - 1]
    .filter((index) => index >= 0)
    .map((index) => ({
      label: points[index].fullLabel,
      value: points[index][metric],
      change: index > 0 ? changeBetween(points[index - 1][metric], points[index][metric]) : null,
      isCurrent: points[index].isCurrent,
    }));
};

export type SalesModule = "ticketing" | "visa" | "hajj" | "tours" | "hotels";

export interface SalesSlice {
  module: SalesModule;
  label: string;
  value: number;
  count: number;
  /** 0–100. */
  share: number;
}

/**
 * Every sales module, in the order the reports read them.
 *
 * One list, exported, because three places used to name the modules
 * themselves — and when Tours and Hotel arrived, two of them carried on
 * reporting three modules while the totals beside them counted five.
 */
export const SALES_MODULES: SalesModule[] = ["ticketing", "visa", "hajj", "tours", "hotels"];

export const SALES_MODULE_LABELS: Record<SalesModule, string> = {
  ticketing: "Tickets",
  visa: "Visa",
  hajj: "Hajj & Umrah",
  tours: "Tours",
  hotels: "Hotel",
};

export interface ModuleRow {
  module: SalesModule;
  label: string;
  count: number;
  sales: number;
  /** Null where the module records no cost, so no margin can be derived. */
  profit: number | null;
}

/** Every module as a row, including the ones that sold nothing this period. */
export const buildModuleRows = (byModule: IModuleBreakdown): ModuleRow[] =>
  SALES_MODULES.map((module) => ({
    module,
    label: SALES_MODULE_LABELS[module],
    count: byModule[module].count,
    sales: byModule[module].sales,
    profit: byModule[module].profit,
  }));

/** How many sales the period holds, across every module. */
export const totalSalesCount = (byModule: IModuleBreakdown): number =>
  SALES_MODULES.reduce((sum, module) => sum + byModule[module].count, 0);

/**
 * One slice per module that actually sold something. A zero slice is dropped
 * rather than drawn as a hairline, and refunds can in principle push a module
 * below zero — a pie cannot show that, so it is left out of the pie too.
 */
export const buildSalesMix = (byModule: IModuleBreakdown): SalesSlice[] => {
  const positive = SALES_MODULES
    .map((module) => ({ module, value: byModule[module].sales, count: byModule[module].count }))
    .filter((row) => row.value > 0);

  const total = positive.reduce((sum, row) => sum + row.value, 0);

  return positive.map((row) => ({
    ...row,
    label: SALES_MODULE_LABELS[row.module],
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


export interface NetPositionBar {
  key: "cash" | "receivable" | "payable" | "net";
  label: string;
  /** Payables are drawn below the axis, because they are owed away. */
  value: number;
  isNegative: boolean;
}

/**
 * What the agency is worth right now: cash, plus what customers owe, minus
 * what it owes suppliers.
 *
 * `netCashFlow` comes from the API rather than being added up here — the same
 * figure is shown on the Reports page, and two places computing it separately
 * is how they end up disagreeing.
 */
export const buildNetPositionBars = (cashFlow: ICashFlow): NetPositionBar[] => [
  { key: "cash", label: "Cash in hand", value: cashFlow.accountBalance, isNegative: cashFlow.accountBalance < 0 },
  { key: "receivable", label: "Customers owe", value: cashFlow.customerDue, isNegative: false },
  { key: "payable", label: "Owed to suppliers", value: -cashFlow.supplierPayable, isNegative: cashFlow.supplierPayable > 0 },
  { key: "net", label: "Net position", value: cashFlow.netCashFlow, isNegative: cashFlow.netCashFlow < 0 },
];

/** True when there is nothing to draw — every figure is zero. */
export const isNetPositionEmpty = (bars: NetPositionBar[]) =>
  bars.every((bar) => bar.value === 0);
