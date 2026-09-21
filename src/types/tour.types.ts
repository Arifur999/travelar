import { type Money } from "./api.types";
import { type PaymentMethod, type TourBookingStatus, type TourStatus } from "./enums.types";

interface IRef {
  id: string;
  name: string;
}

/**
 * One dated trip with its own seats and price — the thing an agency sells.
 *
 * Unlike Hajj there is no batch level: a tour is the departure. An agency
 * running the same itinerary monthly creates one of these per departure.
 */
export interface ITourPackage {
  id: string;
  agencyId: string;
  name: string;
  destination: string;
  departureDate?: string | null;
  returnDate?: string | null;
  durationDays?: number | null;
  /** Null means no fixed limit, which is not the same as being full. */
  seatCapacity: number | null;
  /** Raw Prisma row, so a Decimal string. Read through toNumber(). */
  pricePerPerson: Money;
  costPerPerson: Money;
  inclusions?: string | null;
  description?: string | null;
  status: TourStatus;
  createdById?: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;

  /* --- derived, counted from live bookings at read time --- */
  bookingsCount: number;
  seatsSold: number;
  /** Null when the tour has no capacity set. */
  seatsLeft: number | null;
}

export interface ITourPackageDetail extends ITourPackage {
  /** Sparse — a status with no bookings is absent, so read with `?? 0`. */
  statusBreakdown: Partial<Record<TourBookingStatus, number>>;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  totalCollected: number;
  totalDue: number;
}

export interface ITourPayment {
  id: string;
  agencyId: string;
  bookingId: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface ITourStatusHistory {
  id: string;
  bookingId: string;
  fromStatus?: TourBookingStatus | null;
  toStatus: TourBookingStatus;
  note?: string | null;
  changedAt: string;
}

/**
 * The money on a booking:
 *
 *   profit    = sellAmount − costAmount
 *   dueAmount = sellAmount − Σ payments
 *
 * Both amounts are totals for the whole booking, snapshotted when it was made,
 * so repricing the tour never moves an existing balance.
 */
export interface ITourBooking {
  id: string;
  agencyId: string;
  customerId: string;
  customer: { id: string; name: string; phone: string; passportNo?: string | null };
  packageId: string;
  tourPackage: {
    id: string;
    name: string;
    destination: string;
    departureDate?: string | null;
    returnDate?: string | null;
    pricePerPerson: Money;
  };
  leadTraveller: string;
  travellers: number;
  status: TourBookingStatus;
  note?: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;

  /* --- derived, already numbers --- */
  sellAmount: number;
  costAmount: number;
  profit: number;
  totalPaid: number;
  dueAmount: number;
}

export interface ITourBookingDetail extends ITourBooking {
  payments: ITourPayment[];
  statusHistory: ITourStatusHistory[];
}

export interface ITourBookingsListResponse {
  bookings: ITourBooking[];
  summary: {
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
    totalPaid: number;
    totalDue: number;
  };
}

export interface ITourSummary {
  totalTours: number;
  totalBookings: number;
  totalTravellers: number;
  statusBreakdown: Partial<Record<TourBookingStatus, number>>;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  totalCollected: number;
  totalDue: number;
  /** The next few open departures, soonest first. */
  upcoming: ITourPackage[];
}

export interface ICreateTourPackagePayload {
  name: string;
  destination: string;
  departureDate?: string;
  returnDate?: string;
  durationDays?: number;
  seatCapacity?: number;
  pricePerPerson: number;
  costPerPerson?: number;
  inclusions?: string;
  description?: string;
}

export type IUpdateTourPackagePayload = Partial<ICreateTourPackagePayload> & {
  status?: TourStatus;
};

export interface ICreateTourBookingPayload {
  customerId: string;
  packageId: string;
  leadTraveller: string;
  travellers?: number;
  /** Both default to the tour rate times the seats. */
  sellAmount?: number;
  costAmount?: number;
  note?: string;
}

export interface IUpdateTourBookingPayload {
  leadTraveller?: string;
  travellers?: number;
  sellAmount?: number;
  costAmount?: number;
  note?: string;
}

export interface IChangeTourBookingStatusPayload {
  status: Extract<TourBookingStatus, "CONFIRMED" | "CANCELLED" | "COMPLETED">;
  note?: string;
}

export interface IRecordTourPaymentPayload {
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

/** One-way lifecycle, mirroring TOUR_BOOKING_TRANSITIONS on the backend. */
export const TOUR_BOOKING_TRANSITIONS: Record<TourBookingStatus, TourBookingStatus[]> = {
  RESERVED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["COMPLETED", "CANCELLED"],
  CANCELLED: [],
  COMPLETED: [],
};

export const isTourBookingFinal = (status: TourBookingStatus) =>
  TOUR_BOOKING_TRANSITIONS[status].length === 0;
