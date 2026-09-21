import { describe, expect, it } from "vitest";
import { buildStatusSlices, nightsBetween } from "./hotelCharts";

describe("buildStatusSlices", () => {
  it("reads in the order a booking moves through, not by size", () => {
    const slices = buildStatusSlices({ COMPLETED: 5, RESERVED: 1, CONFIRMED: 4 });

    expect(slices.map((slice) => slice.status)).toEqual(["RESERVED", "CONFIRMED", "COMPLETED"]);
  });

  it("shares add up to the whole", () => {
    const slices = buildStatusSlices({ RESERVED: 1, CONFIRMED: 1, COMPLETED: 2 });

    expect(slices.map((slice) => slice.share)).toEqual([25, 25, 50]);
  });

  it("drops a status nobody has used", () => {
    const slices = buildStatusSlices({ RESERVED: 2, CANCELLED: 0 });

    expect(slices.map((slice) => slice.label)).toEqual(["Reserved"]);
  });

  it("has nothing to draw before the first booking", () => {
    expect(buildStatusSlices({})).toEqual([]);
  });
});

describe("nightsBetween", () => {
  it("counts the nights between the dates", () => {
    expect(nightsBetween("2026-12-01", "2026-12-04")).toBe(3);
  });

  it("counts a same-day booking as one night, as a hotel charges it", () => {
    expect(nightsBetween("2026-12-01", "2026-12-01")).toBe(1);
  });

  it("is not thrown off by a clock change inside the stay", () => {
    // A DST shift makes the span 3 days minus an hour; rounding keeps it at 3.
    expect(nightsBetween("2026-03-27T00:00:00.000Z", "2026-03-29T23:00:00.000Z")).toBe(3);
  });
});
