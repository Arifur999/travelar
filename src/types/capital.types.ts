import { type Money } from "./api.types";
import { type CapitalFlowType } from "./enums.types";

interface IRef {
  id: string;
  name: string;
}

/**
 * Owner capital moving in or out of the business.
 *
 * Absent from the implementation this replaces entirely — its `OWNER_FUNDS`
 * account category was a label with no behaviour behind it, so there was no way
 * to tell the owner's money apart from trading cash.
 */
export interface ICapitalFlow {
  id: string;
  agencyId: string;
  ownerName: string;
  type: CapitalFlowType;
  /** Raw Prisma row, so a Decimal string. Read through toNumber(). */
  amount: Money;
  date: string;
  cashAccountId: string;
  cashAccount: IRef;
  note?: string | null;
  createdById?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ICapitalFlowsListResponse {
  entries: ICapitalFlow[];
  summary: {
    totalInvest: number;
    totalWithdraw: number;
    netInvestment: number;
  };
}

/** Per-owner totals — who has put in what, and what share that represents. */
export interface ICapitalOwner {
  ownerName: string;
  invested: number;
  withdrawn: number;
  netInvestment: number;
  /** Share of the business by capital contributed. 0 when net capital is zero. */
  sharePercent: number;
}

export interface ICapitalSummary {
  owners: ICapitalOwner[];
  summary: {
    totalOwners: number;
    totalInvest: number;
    totalWithdraw: number;
    netInvestment: number;
  };
}

/**
 * Profit taken out of the business, kept apart from a capital withdrawal.
 *
 * Both reduce cash, but only a capital withdrawal reduces what the owner has
 * invested — taking profit does not give back any of the stake. The source
 * spreadsheet keeps them as separate columns for the same reason.
 */
export interface IProfitWithdrawal {
  id: string;
  agencyId: string;
  date: string;
  cashAccountId: string;
  cashAccount: IRef;
  amount: Money;
  receivedBy: string;
  note?: string | null;
  createdById?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IProfitWithdrawalsListResponse {
  withdrawals: IProfitWithdrawal[];
  summary: {
    totalWithdrawn: number;
    totalCount: number;
  };
}

export interface ICreateCapitalFlowPayload {
  ownerName: string;
  type: CapitalFlowType;
  amount: number;
  cashAccountId: string;
  date?: string;
  note?: string;
}

export interface ICreateProfitWithdrawalPayload {
  receivedBy: string;
  amount: number;
  cashAccountId: string;
  date?: string;
  note?: string;
}

/** Amount and account are immutable once posted, on both entities. */
export interface IUpdateDateNotePayload {
  date?: string;
  note?: string;
}
