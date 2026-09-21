import { type ITourPackage } from "@/types/tour.types";

/**
 * Shapes the tour list into what the departures chart draws. Kept free of
 * React so the awkward parts — a tour with no seat limit, one that has not
 * sold anything — have unit tests.
 */

export interface DepartureBar {
  id: string;
  /** Chart label: the tour name, shortened if it would not fit. */
  label: string;
  sold: number;
  /** Seats still for sale; 0 when the tour has no fixed limit. */
  free: number;
  /** Null when the tour has no seat limit, so the card can say so. */
  capacity: number | null;
}

const shorten = (name: string, maxLength = 18) =>
  name.length > maxLength ? `${name.slice(0, maxLength - 1).trimEnd()}…` : name;

/**
 * The next departures, soonest first, as sold-versus-free seats.
 *
 * A tour with no seat limit contributes only its sold seats: drawing "free"
 * for it would have to invent a number, and the bar would claim a capacity
 * nobody set. Tours with no departure date sort last — they are being planned,
 * not sold on a date.
 */
export const buildDepartureBars = (tours: ITourPackage[], limit = 6): DepartureBar[] => {
  const sellable = tours.filter((tour) => tour.status === "OPEN");

  const sorted = [...sellable].sort((a, b) => {
    if (!a.departureDate && !b.departureDate) return a.name.localeCompare(b.name);
    if (!a.departureDate) return 1;
    if (!b.departureDate) return -1;
    return new Date(a.departureDate).getTime() - new Date(b.departureDate).getTime();
  });

  return sorted.slice(0, limit).map((tour) => ({
    id: tour.id,
    label: shorten(tour.name),
    sold: tour.seatsSold,
    free: tour.seatCapacity === null ? 0 : Math.max(0, tour.seatsLeft ?? 0),
    capacity: tour.seatCapacity,
  }));
};

/** How full a tour is, 0–100, or null when it has no seat limit to fill. */
export const fillPercent = (tour: ITourPackage): number | null => {
  if (tour.seatCapacity === null || tour.seatCapacity <= 0) return null;
  return Math.min(100, (tour.seatsSold / tour.seatCapacity) * 100);
};
