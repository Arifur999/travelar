import {
  HOTEL_BOOKING_STATUS_LABELS,
  type HotelBookingStatus,
} from "@/types/enums.types";
import { type IHotelSummary } from "@/types/hotel.types";

/**
 * Shapes the hotel summary into what its chart draws. Kept free of React so
 * the fiddly parts — a status nobody has used, shares that must still add to
 * the whole — have unit tests.
 */

export interface HotelStatusSlice {
  status: HotelBookingStatus;
  label: string;
  count: number;
  /** Percent of every booking, 0–100. */
  share: number;
}

/**
 * The order a booking moves through, so the chart reads left to right the way
 * the work does rather than by whichever status happens to be biggest.
 */
const STATUS_ORDER: HotelBookingStatus[] = ["RESERVED", "CONFIRMED", "COMPLETED", "CANCELLED"];

/**
 * One slice per status that has bookings.
 *
 * A status with none is dropped rather than drawn as a hairline — an agency
 * that has never cancelled anything should not carry an empty "Cancelled"
 * slice forever.
 */
export const buildStatusSlices = (
  breakdown: IHotelSummary["statusBreakdown"],
): HotelStatusSlice[] => {
  const total = STATUS_ORDER.reduce((sum, status) => sum + (breakdown[status] ?? 0), 0);
  if (total === 0) return [];

  return STATUS_ORDER.filter((status) => (breakdown[status] ?? 0) > 0).map((status) => {
    const count = breakdown[status] ?? 0;
    return {
      status,
      label: HOTEL_BOOKING_STATUS_LABELS[status],
      count,
      share: (count / total) * 100,
    };
  });
};

/**
 * Nights between two dates, the same way the API counts them: a same-day
 * booking is one night, which is what a hotel charges for it.
 */
export const nightsBetween = (checkIn: string, checkOut: string) => {
  const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(1, Math.round(ms / (24 * 60 * 60 * 1000)));
};
