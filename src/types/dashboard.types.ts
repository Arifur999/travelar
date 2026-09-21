/** Per-module contribution inside an overview. */
export interface IModuleBreakdown {
  ticketing: { count: number; sales: number; profit: number };
  visa: { count: number; sales: number; profit: number };
  /**
   * `profit` is null on purpose, not zero.
   *
   * A Hajj booking records what the pilgrim is charged but nothing about what
   * the package costs the agency, so there is no margin to report. Treating the
   * package price as profit would overstate it by the entire cost of every
   * pilgrim, which is exactly what a naive port would have done.
   */
  hajj: { count: number; sales: number; profit: null };
  /** Tours record both sides, so their margin is real. */
  tours: { count: number; sales: number; profit: number };
}

export interface IIncomeByAirlineRow {
  airlineId: string | null;
  /** "Unassigned" when a ticket has no airline; "Unknown" if it was removed. */
  name: string;
  shortCode: string;
  count: number;
  sales: number;
  profit: number;
}

export interface IExpenseByCategoryRow {
  categoryId: string;
  name: string;
  color: string | null;
  amount: number;
  share: number;
}

/**
 * The overview the source spreadsheet shows on its Custom, Monthly and Yearly
 * dashboards — the same figures at three different scopes.
 */
export interface IDashboardOverview {
  period: { from: string; to: string };
  salesGoal: number;
  profitGoal: number;
  actualSales: number;
  actualProfit: number;
  expenses: number;
  /** actualProfit − expenses. */
  profitLoss: number;
  profitWithdraw: number;
  /** profitLoss − profitWithdraw: what the period actually added to the business. */
  increaseOrDecrease: number;
  /** 0 when no goal is set — treat that as "not tracked", not "0% achieved". */
  salesProgress: number;
  profitProgress: number;
  byModule: IModuleBreakdown;
  incomeByAirline: IIncomeByAirlineRow[];
  expenseByCategory: IExpenseByCategoryRow[];
}

export interface IMonthlyOverview extends IDashboardOverview {
  year: number;
  month: number;
}

export interface IMonthlyBreakdownRow {
  year: number;
  month: number;
  monthName: string;
  salesGoal: number;
  actualSales: number;
  profitGoal: number;
  actualProfit: number;
  expenses: number;
  profitLoss: number;
  profitWithdraw: number;
}

export interface IYearlyOverview extends IDashboardOverview {
  year: number;
  months: IMonthlyBreakdownRow[];
}

/**
 * Where the money stands, reconciled the way the spreadsheet's Cash Flow tab
 * does it: what is in the accounts, plus what customers still owe, less what is
 * still owed to suppliers.
 */
export interface ICashFlowAccount {
  id: string;
  name: string;
  category: string;
  isActive: boolean;
  /** Can be negative: expenses and payouts are allowed to overdraw. */
  balance: number;
}

export interface ICashFlow {
  /** Each account's balance, largest first. They sum to accountBalance. */
  accounts: ICashFlowAccount[];
  accountBalance: number;
  customerDue: number;
  /** accountBalance + customerDue. */
  totalAssets: number;
  supplierPayable: number;
  /** totalAssets − supplierPayable. */
  netCashFlow: number;
  invested: number;
  withdrawn: number;
  netInvestment: number;
  /** netCashFlow − netInvestment: what the business generated beyond the owners' money. */
  difference: number;
}

/** One calendar month of the landing trend. The current month is to date. */
export interface ITrendMonth {
  year: number;
  /** 1–12. */
  month: number;
  sales: number;
  profit: number;
  expenses: number;
}

/**
 * The landing dashboard: this calendar month, the current cash position, and
 * the last six months (oldest first, this month last). A base feature, so it
 * is served on every plan.
 */
/**
 * What a new agency still has to do before the figures mean anything. Any of
 * the three sales modules counts as a sale, from any month.
 */
export interface ISetupProgress {
  hasCashAccount: boolean;
  hasCustomer: boolean;
  hasSale: boolean;
}

export interface IDashboardSummary {
  thisMonth: IDashboardOverview;
  cashFlow: ICashFlow;
  trend: ITrendMonth[];
  setup: ISetupProgress;
}

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;
