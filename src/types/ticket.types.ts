import { type Money } from "./api.types";
import { type PaymentMethod, type TicketStatus } from "./enums.types";

interface IRef {
  id: string;
  name: string;
}

export interface ITicketPayment {
  id: string;
  agencyId: string;
  ticketId: string;
  /** Raw Prisma row, so a Decimal string. Read through toNumber(). */
  amount: Money;
  method: PaymentMethod;
  /** null on a settlement from the customer balance: no account moved. */
  cashAccountId: string | null;
  cashAccount: IRef | null;
  /** Paid out of what the customer handed over earlier, so nothing posted. */
  fromWallet: boolean;
  reference?: string | null;
  note?: string | null;
  paidAt: string;
  recordedById?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ITicketStatusHistory {
  id: string;
  ticketId: string;
  fromStatus?: TicketStatus | null;
  toStatus: TicketStatus;
  note?: string | null;
  changedById?: string | null;
  changedAt: string;
}

/**
 * A flight ticket. All the money on it is additive:
 *
 *   customerCharge = fare + dateChangeFee − refundAmount
 *   supplierCost   = cost + dateChangeCost
 *   profit         = customerCharge − supplierCost
 *   dueAmount      = customerCharge − Σ payments
 *
 * A date change ADDS to both sides rather than replacing either. The old
 * implementation had no date-change concept and its reissue path overwrote the
 * fare while leaving cost untouched, so a reissue silently inflated profit by
 * the whole fare difference. Refunds there were inert — recorded, then excluded
 * from every calculation — so a refunded ticket still counted full revenue and
 * still showed the customer owing.
 *
 * `fare`, `cost`, `profit` and the date-change columns come off a raw Prisma
 * row and are therefore Decimal strings. The four derived figures at the bottom
 * are computed in the service and arrive as real numbers.
 */
export interface ITicket {
  id: string;
  agencyId: string;

  customerId: string;
  customer: { id: string; name: string; phone: string; passportNo?: string | null };

  supplierId?: string | null;
  supplier?: IRef | null;

  airlineId?: string | null;
  airline?: { id: string; name: string; shortCode: string; logoUrl?: string | null } | null;

  routeId?: string | null;
  route?: IRef | null;

  passengerName: string;
  pnr: string;
  travelDate?: string | null;
  issueDate: string;

  fare: Money;
  cost: Money;
  /** Denormalized, but only ever written by the service from the formula above. */
  profit: Money;

  status: TicketStatus;
  refundAmount?: Money | null;

  dateChangedAt?: string | null;
  dateChangeCost?: Money | null;
  dateChangeFee?: Money | null;

  createdById?: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;

  /* --- derived in the service, so real numbers --- */
  customerCharge: number;
  supplierCost: number;
  totalPaid: number;
  dueAmount: number;
}

/** `GET /ticketing/:id` also includes these. */
export interface ITicketDetail extends ITicket {
  payments: ITicketPayment[];
  statusHistory: ITicketStatusHistory[];
}

export interface ITicketsListResponse {
  tickets: ITicket[];
  /** Across every ticket in the agency, not just the current page. */
  summary: {
    totalSales: number;
    totalCost: number;
    totalProfit: number;
    totalPaid: number;
    totalDue: number;
  };
}

export interface ICreateTicketPayload {
  customerId: string;
  supplierId?: string;
  airlineId?: string;
  routeId?: string;
  passengerName: string;
  pnr: string;
  travelDate?: string;
  issueDate?: string;
  fare: number;
  cost: number;
}

/** Status is absent on purpose — only the status route can move the lifecycle. */
export type IUpdateTicketPayload = Partial<ICreateTicketPayload>;

export interface IDateChangePayload {
  dateChangedAt?: string;
  travelDate?: string;
  dateChangeCost?: number;
  dateChangeFee?: number;
}

/** ISSUED → REISSUED | REFUNDED | VOID; REISSUED → REFUNDED | VOID. */
export interface IChangeTicketStatusPayload {
  status: Extract<TicketStatus, "REISSUED" | "REFUNDED" | "VOID">;
  refundAmount?: number;
  note?: string;
}

export interface IRecordTicketPaymentPayload {
  /**
   * Absent on a wallet payment: nothing moves between accounts, so there is
   * no account to name.
   */
  cashAccountId?: string;
  /** Spend what the customer paid in earlier instead of taking money now. */
  fromWallet?: boolean;
  amount: number;
  method?: PaymentMethod;
  reference?: string;
  note?: string;
  paidAt?: string;
}

/**
 * The one-way lifecycle, mirroring TICKET_TRANSITIONS on the backend. An empty
 * list means the status is final and no further change is allowed.
 */
export const TICKET_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  ISSUED: ["REISSUED", "REFUNDED", "VOID"],
  REISSUED: ["REFUNDED", "VOID"],
  REFUNDED: [],
  VOID: [],
};

export const isTicketFinal = (status: TicketStatus) => TICKET_TRANSITIONS[status].length === 0;
