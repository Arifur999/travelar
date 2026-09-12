import { type CashAccountCategory, type PostingSource } from "./enums.types";

/**
 * A cash account with its balance derived from the posting ledger.
 *
 * `currentBalance` is `totalIn − totalOut`, and the opening balance is itself
 * an `OPENING` posting inside those totals — so never add `openingBalance` to
 * `currentBalance`. The backend had exactly that double-count bug once, and
 * `openingBalance` is exposed here only so the UI can show what the account
 * started at.
 */
export interface IAccountBalance {
  id: string;
  name: string;
  category: CashAccountCategory;
  isActive: boolean;
  openingBalance: number;
  totalIn: number;
  totalOut: number;
  currentBalance: number;
}

/** One row of the Balance Dashboard: an account plus its per-source totals. */
export interface IAccountOverviewRow extends IAccountBalance {
  /**
   * Signed net per posting source (IN positive, OUT negative). Sparse — a
   * source with no postings on this account is simply absent, so always read
   * it with a `?? 0`.
   */
  bySource: Partial<Record<PostingSource, number>>;
}

export interface IAccountsSummary {
  totalAccounts: number;
  activeAccounts: number;
  /** Active accounts only — an archived account must not inflate the headline. */
  totalBalance: number;
  inactiveBalance: number;
}

/** `GET /accounts` — unpaginated; the account list is deliberately small. */
export interface IAccountsListResponse {
  data: IAccountBalance[];
  summary: IAccountsSummary;
}

export interface IAccountOverviewResponse {
  data: IAccountOverviewRow[];
  summary: {
    totalAccounts: number;
    totalBalance: number;
    inactiveBalance: number;
  };
}

export interface ICreateCashAccountPayload {
  name: string;
  category?: CashAccountCategory;
  /** Seeds the ledger at creation. Not editable afterwards — see below. */
  openingBalance?: number;
  isActive?: boolean;
}

/**
 * `openingBalance` is deliberately absent: it writes an OPENING posting when
 * the account is created, so changing it later would silently rewrite history.
 * The API rejects it too.
 */
export interface IUpdateCashAccountPayload {
  name?: string;
  category?: CashAccountCategory;
  isActive?: boolean;
}

/* ------------------------------- transfers ------------------------------- */

interface IAccountRef {
  id: string;
  name: string;
}

export interface IBalanceTransfer {
  id: string;
  agencyId: string;
  fromAccountId: string;
  fromAccount: IAccountRef;
  toAccountId: string;
  toAccount: IAccountRef;
  amount: number;
  date: string;
  note?: string | null;
  transferredById?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IBalanceTransfersResponse {
  transfers: IBalanceTransfer[];
  summary: {
    totalAmount: number;
    totalCount: number;
  };
}

export interface ICreateBalanceTransferPayload {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  date?: string;
  note?: string;
}

/** Amount and accounts are immutable once posted — delete and recreate instead. */
export interface IUpdateBalanceTransferPayload {
  date?: string;
  note?: string;
}
