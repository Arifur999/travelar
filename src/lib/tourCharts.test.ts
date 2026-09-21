import { describe, expect, it } from "vitest";
import { buildDepartureBars, fillPercent } from "./tourCharts";
import { type ITourPackage } from "@/types/tour.types";

const tour = (overrides: Partial<ITourPackage> & { id: string }): ITourPackage => ({
  agencyId: "a",
  name: overrides.id,
  destination: "Somewhere",
  departureDate: null,
  returnDate: null,
  durationDays: null,
  seatCapacity: 10,
  pricePerPerson: "5000",
  costPerPerson: "3000",
  inclusions: null,
  description: null,
  status: "OPEN",
  isDeleted: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  bookingsCount: 0,
  seatsSold: 0,
  seatsLeft: 10,
  ...overrides,
});

describe("buildDepartureBars", () => {
  it("puts the soonest departure first", () => {
    const bars = buildDepartureBars([
      tour({ id: "March", departureDate: "2026-03-01T00:00:00.000Z" }),
      tour({ id: "January", departureDate: "2026-01-15T00:00:00.000Z" }),
    ]);

    expect(bars.map((bar) => bar.label)).toEqual(["January", "March"]);
  });

  it("sorts a tour with no date last — it is being planned, not sold", () => {
    const bars = buildDepartureBars([
      tour({ id: "Undated" }),
      tour({ id: "Dated", departureDate: "2026-05-01T00:00:00.000Z" }),
    ]);

    expect(bars.map((bar) => bar.label)).toEqual(["Dated", "Undated"]);
  });

  it("leaves out a tour that is no longer selling", () => {
    const bars = buildDepartureBars([
      tour({ id: "Closed", status: "CLOSED" }),
      tour({ id: "Open" }),
    ]);

    expect(bars.map((bar) => bar.label)).toEqual(["Open"]);
  });

  it("claims no free seats for a tour with no limit", () => {
    const bars = buildDepartureBars([
      tour({ id: "Unlimited", seatCapacity: null, seatsLeft: null, seatsSold: 12 }),
    ]);

    expect(bars[0]).toMatchObject({ sold: 12, free: 0, capacity: null });
  });

  it("never reports negative free seats", () => {
    const bars = buildDepartureBars([
      tour({ id: "Oversold", seatCapacity: 4, seatsSold: 5, seatsLeft: -1 }),
    ]);

    expect(bars[0]!.free).toBe(0);
  });

  it("shows only the next few", () => {
    const many = Array.from({ length: 9 }, (_, i) =>
      tour({ id: `Tour ${i}`, departureDate: `2026-0${(i % 9) + 1}-01T00:00:00.000Z` }),
    );

    expect(buildDepartureBars(many, 6)).toHaveLength(6);
  });
});

describe("fillPercent", () => {
  it("is how much of the tour is sold", () => {
    expect(fillPercent(tour({ id: "t", seatCapacity: 20, seatsSold: 5 }))).toBe(25);
  });

  it("has nothing to report when there is no limit to fill", () => {
    expect(fillPercent(tour({ id: "t", seatCapacity: null }))).toBeNull();
  });

  it("stops at full even if a tour was oversold", () => {
    expect(fillPercent(tour({ id: "t", seatCapacity: 4, seatsSold: 6 }))).toBe(100);
  });
});
