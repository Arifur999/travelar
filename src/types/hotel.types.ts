import { type Money } from "./api.types";
import { type HotelBookingStatus, type PaymentMethod } from "./enums.types";

interface IRef {
  id: string;
  name: string;
}

export interface IHotelPayment {
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

export interface IHotelStatusHistory {
  id: string;
  bookingId: string;
  fromStatus?: HotelBookingStatus | null;
  toStatus: HotelBookingStatus;
  note?: string | null;
  changedAt: string;
}

/**
 * One hotel stay sold to a customer.
 *
 *   profit    = sellAmount − costAmount
 *   dueAmount = sellAmount − Σ payments
 *   nights    = the gap between the dates, computed by the API
 *
 * There is no hotel master list and no supplier link — see hotels.prisma in
 * the API for why.
 */
export interface IHotelBooking {
  id: string;
  agencyId: string;
  customerId: string;
  customer: { id: string; name: string; phone: string; passportNo?: string | null };
  hotelName: string;
  city: string;
  country?: string | null;
  /** Free text: who the rate came from. */
  bookedThrough?: string | null;
  confirmationNo?: string | null;
  guestName: string;
  checkIn: string;
  checkOut: string;
  rooms: number;
  guests: number;
  roomType?: string | null;
  status: HotelBookingStatus;
  note?: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;

  /* --- derived, already numbers --- */
  sellAmount: number;
  costAmount: number;
  profit: number;
  nights: number;
  totalPaid: number;
  dueAmount: number;
}

export interface IHotelBookingDetail extends IHotelBooking {
  payments: IHotelPayment[];
  statusHistory: IHotelStatusHistory[];
}

export interface IHotelBookingsListResponse {
  bookings: IHotelBooking[];
  summary: {
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
    totalPaid: number;
    totalDue: number;
  };
}

export interface IHotelSummary {
  totalBookings: number;
  totalRooms: number;
  totalGuests: number;
  statusBreakdown: Partial<Record<HotelBookingStatus, number>>;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  totalCollected: number;
  totalDue: number;
  /** The next guests to check in, soonest first. */
  arriving: IHotelBooking[];
}

export interface ICreateHotelBookingPayload {
  customerId: string;
  hotelName: string;
  city: string;
  country?: string;
  bookedThrough?: string;
  confirmationNo?: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  rooms?: number;
  guests?: number;
  roomType?: string;
  sellAmount: number;
  costAmount?: number;
  note?: string;
}

/** The customer is absent: a stay cannot change hands. */
export type IUpdateHotelBookingPayload = Partial<Omit<ICreateHotelBookingPayload, "customerId">>;

export interface IChangeHotelBookingStatusPayload {
  status: Extract<HotelBookingStatus, "CONFIRMED" | "CANCELLED" | "COMPLETED">;
  note?: string;
}

export interface IRecordHotelPaymentPayload {
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

/** One-way lifecycle, mirroring HOTEL_BOOKING_TRANSITIONS on the backend. */
export const HOTEL_BOOKING_TRANSITIONS: Record<HotelBookingStatus, HotelBookingStatus[]> = {
  RESERVED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["COMPLETED", "CANCELLED"],
  CANCELLED: [],
  COMPLETED: [],
};

export const isHotelBookingFinal = (status: HotelBookingStatus) =>
  HOTEL_BOOKING_TRANSITIONS[status].length === 0;
