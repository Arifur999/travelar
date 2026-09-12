import { type Money } from "./api.types";

/**
 * A vendor the agency buys tickets and services from.
 *
 * Vocabulary note: the source spreadsheet calls these "Agency Name". Here
 * `Agency` is the tenant and `Supplier` is who that tenant buys from.
 */
export interface ISupplier {
  id: string;
  agencyId: string;
  name: string;
  contactName?: string | null;
  phone?: string | null;
  address?: string | null;
  createdById?: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;

  /* --- derived, never stored: see ISupplierLedgerTotals below --- */
  openingPayable: number;
  totalPurchase: number;
  totalPaid: number;
  currentPayable: number;
}

/**
 * What the agency owes:
 *
 *   currentPayable = openingPayable + Σ purchases − Σ payments
 *
 * Purchases are the buying price of every live ticket bought from the
 * supplier, including what they charged for a date change (which is additive
 * on both sides).
 *
 * A negative figure is meaningful and allowed — it is an advance sitting with
 * the supplier, not an error. Do not clamp it to zero in the UI.
 */
export interface ISupplierLedgerTotals {
  openingPayable: number;
  totalPurchase: number;
  totalPaid: number;
  currentPayable: number;
}

export interface ISupplierDashboard {
  data: ISupplier[];
  summary: {
    totalSuppliers: number;
    totalOpeningPayable: number;
    totalPurchase: number;
    totalPaid: number;
    totalCurrentPayable: number;
  };
}

/** Row of the chronological statement. Debit increases payable, credit reduces it. */
export interface ISupplierLedgerRow {
  date: string;
  type: "opening" | "purchase" | "payment";
  description: string;
  debit: number;
  credit: number;
  runningPayable: number;
}

export interface ISupplierLedger {
  supplier: ISupplier;
  rows: ISupplierLedgerRow[];
}

export interface ICreateSupplierPayload {
  name: string;
  contactName?: string;
  phone?: string;
  address?: string;
  openingPayable?: number;
}

export type IUpdateSupplierPayload = Partial<ICreateSupplierPayload>;

/* --------------------------- supplier payments --------------------------- */

export interface ISupplierTransaction {
  id: string;
  agencyId: string;
  supplierId: string;
  supplier: { id: string; name: string; phone?: string | null };
  cashAccountId: string;
  cashAccount: { id: string; name: string };
  /** Raw Prisma row, so this is a Decimal string. Read it through toNumber(). */
  amount: Money;
  date: string;
  note?: string | null;
  paidById?: string | null;
  createdById?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ISupplierTransactionsResponse {
  transactions: ISupplierTransaction[];
  summary: {
    totalPaid: number;
    totalCount: number;
  };
}

/**
 * What POST /supplier-transactions actually returns — the row plus the
 * supplier's recomputed payable, NOT the row on its own. Getting this wrong
 * is why an earlier version read result.data.id as undefined.
 */
export interface ICreateSupplierTransactionResponse {
  transaction: ISupplierTransaction;
  supplierPayable: number;
}

export interface ICreateSupplierTransactionPayload {
  supplierId: string;
  cashAccountId: string;
  amount: number;
  date?: string;
  note?: string;
}

/** Amount and account are immutable once posted — delete and recreate instead. */
export interface IUpdateSupplierTransactionPayload {
  date?: string;
  note?: string;
}
