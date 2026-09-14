import { type Money } from "./api.types";

/**
 * A customer, with the balance derived from every module that bills them.
 *
 *   currentDue = openingDue
 *              + Σ sales        (tickets, visa cases, hajj bookings)
 *              − Σ collections  (payments against those, plus due receipts)
 *              − Σ discounts
 *
 * All three sales modules contribute. The implementation this replaces counted
 * only tickets, so a customer could owe thousands on a visa case and still show
 * a zero balance.
 *
 * A negative figure is meaningful and allowed: the customer is in credit. Do
 * not clamp it to zero in the UI.
 */
export interface ICustomer {
  id: string;
  agencyId: string;
  name: string;
  phone: string;
  email?: string | null;
  passportNo?: string | null;
  address?: string | null;
  note?: string | null;
  createdById?: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;

  /* --- derived in the service, so these arrive as real numbers --- */
  openingDue: number;
  totalPurchase: number;
  collectionsAmount: number;
  totalDiscount: number;
  currentDue: number;
}

export interface ICustomerDashboard {
  data: ICustomer[];
  summary: {
    totalCustomers: number;
    totalOpeningDue: number;
    totalPurchase: number;
    totalCollections: number;
    totalDiscount: number;
    totalCurrentDue: number;
  };
}

export type CustomerLedgerRowType =
  | "opening"
  | "ticket"
  | "ticket-payment"
  | "visa"
  | "visa-payment"
  | "hajj"
  | "hajj-payment"
  | "due-received"
  | "discount";

/**
 * Debit increases what is owed; credit reduces it. The rows cover every module
 * that feeds `currentDue`, so the last `runningDue` equals it.
 */
export interface ICustomerLedgerRow {
  date: string;
  type: CustomerLedgerRowType;
  description: string;
  debit: number;
  credit: number;
  runningDue: number;
}

export interface ICustomerLedger {
  customer: ICustomer;
  rows: ICustomerLedgerRow[];
}

export interface ICreateCustomerPayload {
  name: string;
  phone: string;
  email?: string;
  passportNo?: string;
  address?: string;
  note?: string;
  openingDue?: number;
}

export type IUpdateCustomerPayload = Partial<ICreateCustomerPayload>;

/* ------------------------------- collections ----------------------------- */

interface IAccountRef {
  id: string;
  name: string;
}

/**
 * Money collected against a customer's overall balance rather than against one
 * specific sale.
 *
 * Split tender is first-class: a customer can settle partly in cash and partly
 * by bank in one receipt, which is why there are two account/amount pairs
 * rather than one.
 */
export interface IDueReceived {
  id: string;
  agencyId: string;
  customerId: string;
  customer: { id: string; name: string; phone: string };
  date: string;

  cashAccount1Id: string;
  cashAccount1: IAccountRef;
  /** Raw Prisma row, so these are Decimal strings. Read through toNumber(). */
  amount1: Money;

  cashAccount2Id?: string | null;
  cashAccount2?: IAccountRef | null;
  amount2: Money;

  /**
   * Posts to no account — it only reduces what the customer owes, which is why
   * it stays editable after the receipt is written while the amounts do not.
   */
  discount: Money;
  discountCategory?: string | null;

  paymentReceiverId?: string | null;
  notes?: string | null;
  createdById?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IDueReceivedListResponse {
  receipts: IDueReceived[];
  summary: {
    totalReceived: number;
    totalDiscount: number;
    totalCount: number;
  };
}

/** What POST /due-received returns — the row plus both recomputed figures. */
export interface ICreateDueReceivedResponse {
  receipt: IDueReceived;
  totalReceived: number;
  customerDue: number;
}

export interface ICreateDueReceivedPayload {
  customerId: string;
  cashAccount1Id: string;
  amount1: number;
  cashAccount2Id?: string;
  amount2?: number;
  discount?: number;
  discountCategory?: string;
  date?: string;
  notes?: string;
}

/** Amounts and accounts are immutable once posted; the discount is not. */
export interface IUpdateDueReceivedPayload {
  date?: string;
  discount?: number;
  discountCategory?: string;
  notes?: string;
}
