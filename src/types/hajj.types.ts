import { type Money } from "./api.types";
import {
  type DocumentStatus,
  type HajjBatchStatus,
  type HajjBookingStatus,
  type HajjHotelType,
  type HajjMealPlan,
  type HajjPackageType,
  type HajjTier,
  type PaymentMethod,
} from "./enums.types";

interface IRef {
  id: string;
  name: string;
}

export interface IHajjPackage {
  id: string;
  agencyId: string;
  name: string;
  type: HajjPackageType;
  tier?: HajjTier | null;
  /** Raw Prisma row, so a Decimal string. Read through toNumber(). */
  price: Money;
  durationDays?: number | null;
  makkahHotel?: string | null;
  makkahDistance?: string | null;
  madinahHotel?: string | null;
  madinahDistance?: string | null;
  muallim?: string | null;
  mealPlan?: HajjMealPlan | null;
  description?: string | null;
  isActive: boolean;
  createdById?: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * A departure group. Seats are counted from live bookings only — a CANCELLED
 * booking frees its bed, which the previous implementation never did, so a
 * cancelled pilgrim kept occupying a seat and a room forever.
 */
export interface IHajjBatch {
  id: string;
  agencyId: string;
  packageId: string;
  hajjPackage?: { id: string; name: string; type: HajjPackageType } | null;
  name: string;
  departureDate: string;
  returnDate?: string | null;
  seatCapacity: number;
  status: HajjBatchStatus;
  createdById?: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;

  /* --- derived --- */
  bookedSeats: number;
  availableSeats: number;
}

export interface IHajjBatchSummary extends IHajjBatch {
  /** Sparse — a status with no bookings is absent, so read with `?? 0`. */
  statusBreakdown: Partial<Record<HajjBookingStatus, number>>;
  totalRevenue: number;
  totalCollected: number;
  totalDue: number;
  roomOccupancy: {
    makkah: { total: number; occupied: number };
    madinah: { total: number; occupied: number };
  };
}

export interface IHajjRoom {
  id: string;
  agencyId: string;
  batchId: string;
  hotelType: HajjHotelType;
  roomNumber: string;
  capacity: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IHajjDocument {
  id: string;
  agencyId: string;
  bookingId: string;
  title: string;
  status: DocumentStatus;
  fileUrl?: string | null;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IHajjPayment {
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
  transactionRef?: string | null;
  note?: string | null;
  paidAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface IHajjStatusHistory {
  id: string;
  bookingId: string;
  fromStatus?: HajjBookingStatus | null;
  toStatus: HajjBookingStatus;
  note?: string | null;
  changedById?: string | null;
  changedAt: string;
}

interface IRoomRef {
  id: string;
  roomNumber: string;
  capacity: number;
}

/**
 * One row per pilgrim.
 *
 *   dueAmount = packagePrice − Σ payments
 *
 * `packagePrice` is snapshotted at booking time, so a later price change on the
 * package never moves an existing booking's balance.
 *
 * Note what is NOT here: a cost. A booking records what the pilgrim is charged
 * but nothing about what the package costs the agency, so Hajj profit cannot be
 * derived — the dashboard reports it as null rather than treating the whole
 * package price as margin.
 */
export interface IHajjBooking {
  id: string;
  agencyId: string;

  customerId: string;
  customer: { id: string; name: string; phone: string; passportNo?: string | null };

  packageId: string;
  hajjPackage: { id: string; name: string; type: HajjPackageType; tier?: HajjTier | null };

  batchId: string;
  batch: { id: string; name: string; departureDate: string };

  pilgrimName: string;
  passportNumber?: string | null;
  munajjimNumber?: string | null;

  makkahRoomId?: string | null;
  makkahRoom?: IRoomRef | null;
  madinahRoomId?: string | null;
  madinahRoom?: IRoomRef | null;

  status: HajjBookingStatus;
  createdById?: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;

  /* --- derived in the service, so real numbers --- */
  packagePrice: number;
  totalPaid: number;
  dueAmount: number;
  documentsProgress: { received: number; total: number };
}

export interface IHajjBookingDetail extends IHajjBooking {
  documents: IHajjDocument[];
  payments: IHajjPayment[];
  statusHistory: IHajjStatusHistory[];
}

export interface IHajjBookingsListResponse {
  bookings: IHajjBooking[];
  summary: {
    totalRevenue: number;
    totalPaid: number;
    totalDue: number;
  };
}

/* -------------------------------- payloads ------------------------------- */

export interface ICreateHajjPackagePayload {
  name: string;
  type: HajjPackageType;
  tier?: HajjTier;
  price: number;
  durationDays?: number;
  makkahHotel?: string;
  makkahDistance?: string;
  madinahHotel?: string;
  madinahDistance?: string;
  muallim?: string;
  mealPlan?: HajjMealPlan;
  description?: string;
  isActive?: boolean;
}

export interface ICreateHajjBatchPayload {
  packageId: string;
  name: string;
  departureDate: string;
  returnDate?: string;
  seatCapacity: number;
}

export type IUpdateHajjBatchPayload = Partial<ICreateHajjBatchPayload> & {
  status?: HajjBatchStatus;
};

export interface ICreateHajjRoomPayload {
  batchId: string;
  hotelType: HajjHotelType;
  roomNumber: string;
  capacity: number;
}

export interface ICreateHajjBookingPayload {
  customerId: string;
  packageId: string;
  batchId: string;
  pilgrimName: string;
  passportNumber?: string;
  munajjimNumber?: string;
  /** Defaults to the package price when omitted, then snapshotted. */
  packagePrice?: number;
}

export interface IChangeHajjBookingStatusPayload {
  status: Extract<HajjBookingStatus, "CONFIRMED" | "CANCELLED" | "COMPLETED">;
  note?: string;
}

export interface IAssignRoomPayload {
  hotelType: HajjHotelType;
  /** null clears the assignment and frees the bed. */
  roomId?: string | null;
}

export interface IRecordHajjPaymentPayload {
  /**
   * Absent on a wallet payment: nothing moves between accounts, so there is
   * no account to name.
   */
  cashAccountId?: string;
  /** Spend what the customer paid in earlier instead of taking money now. */
  fromWallet?: boolean;
  amount: number;
  method?: PaymentMethod;
  transactionRef?: string;
  note?: string;
  paidAt?: string;
}

/** One-way lifecycle, mirroring HAJJ_BOOKING_TRANSITIONS on the backend. */
export const HAJJ_BOOKING_TRANSITIONS: Record<HajjBookingStatus, HajjBookingStatus[]> = {
  RESERVED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["COMPLETED", "CANCELLED"],
  CANCELLED: [],
  COMPLETED: [],
};

export const isHajjBookingFinal = (status: HajjBookingStatus) =>
  HAJJ_BOOKING_TRANSITIONS[status].length === 0;
