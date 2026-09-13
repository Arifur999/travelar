import { type Money } from "./api.types";

interface IRef {
  id: string;
  name: string;
}

export interface IExpenseCategory {
  id: string;
  agencyId: string;
  name: string;
  /** Hex swatch for the category donut. The API assigns one from a preset list when omitted. */
  color?: string | null;
  monthlyBudget: Money;
  yearlyBudget: Money;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IExpense {
  id: string;
  agencyId: string;
  categoryId: string;
  category: IRef & { color?: string | null };
  cashAccountId: string;
  cashAccount: IRef;
  /** Raw Prisma row, so a Decimal string. Read through toNumber(). */
  amount: Money;
  date: string;
  notes?: string | null;
  createdById?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IExpensesListResponse {
  expenses: IExpense[];
  summary: {
    totalExpense: number;
    totalCount: number;
  };
}

/** One slice of the category breakdown, with budget usage already worked out. */
export interface IExpenseCategoryBreakdown {
  id: string;
  name: string;
  color?: string | null;
  total: number;
  thisMonth: number;
  monthlyBudget: number;
  yearlyBudget: number;
  /** 0 when no monthly budget is set — treat that as "not tracked", not "0% used". */
  percentUsedMonth: number;
  shareOfTotal: number;
}

export interface IExpenseDashboard {
  totalExpenses: number;
  thisMonthTotal: number;
  thisYearTotal: number;
  totalCategories: number;
  byCategory: IExpenseCategoryBreakdown[];
  /** null when nothing has been spent yet. */
  topExpenseCategory: IExpenseCategoryBreakdown | null;
}

export interface ICreateExpenseCategoryPayload {
  name: string;
  color?: string;
  monthlyBudget?: number;
  yearlyBudget?: number;
}

export type IUpdateExpenseCategoryPayload = Partial<ICreateExpenseCategoryPayload>;

export interface ICreateExpensePayload {
  categoryId: string;
  cashAccountId: string;
  amount: number;
  date?: string;
  notes?: string;
}

/**
 * Amount and account are immutable once posted — they have already moved a
 * balance. The category is not: recategorising is a reporting change that moves
 * no money.
 */
export interface IUpdateExpensePayload {
  categoryId?: string;
  date?: string;
  notes?: string;
}
