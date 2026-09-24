import { describe, expect, it } from "vitest";
import { CHART_COLORS, safeKey, seriesColor, shapeSlices, slicesTotal, type ChartSlice } from "./chartSlices";

const slice = (key: string, value: number): ChartSlice => ({
  key,
  label: key,
  value,
  color: "var(--chart-1)",
});

describe("shapeSlices", () => {
  it("gives each slice its share of the total", () => {
    const result = shapeSlices([slice("paid", 750), slice("due", 250)]);

    expect(result.map((s) => [s.key, s.share])).toEqual([
      ["paid", 75],
      ["due", 25],
    ]);
  });

  it("drops a slice worth nothing rather than drawing a hairline", () => {
    const result = shapeSlices([slice("paid", 1000), slice("due", 0)]);

    expect(result.map((s) => s.key)).toEqual(["paid"]);
    expect(result[0].share).toBe(100);
  });

  it("drops a negative slice instead of letting it overstate the rest", () => {
    // Folding −500 in would leave a total of 1,000 and a 150% share.
    const result = shapeSlices([slice("sales", 1500), slice("refunds", -500)]);

    expect(result.map((s) => s.key)).toEqual(["sales"]);
    expect(result[0].share).toBe(100);
  });

  it("returns nothing when there is nothing to draw", () => {
    expect(shapeSlices([])).toEqual([]);
    expect(shapeSlices([slice("a", 0), slice("b", -10)])).toEqual([]);
  });

  it("keeps the fields the legend prints", () => {
    const result = shapeSlices([
      { key: "paid", label: "Collected", value: 400, color: "var(--success)", note: "12 tickets" },
    ]);

    expect(result[0]).toMatchObject({
      label: "Collected",
      color: "var(--success)",
      note: "12 tickets",
    });
  });
});

describe("slicesTotal", () => {
  it("adds up only what is drawn, so the centre matches the arcs", () => {
    expect(slicesTotal([slice("paid", 750), slice("due", 250)])).toBe(1000);
    expect(slicesTotal([slice("sales", 1500), slice("refunds", -500)])).toBe(1500);
  });

  it("is zero when there is nothing to draw", () => {
    expect(slicesTotal([])).toBe(0);
    expect(slicesTotal([slice("a", 0)])).toBe(0);
  });
});

describe("seriesColor", () => {
  it("walks the five slots and then wraps", () => {
    expect(seriesColor(0)).toBe(CHART_COLORS[0]);
    expect(seriesColor(4)).toBe(CHART_COLORS[4]);
    expect(seriesColor(5)).toBe(CHART_COLORS[0]);
    expect(seriesColor(12)).toBe(CHART_COLORS[2]);
  });
});

describe("safeKey", () => {
  it("turns a name into something a CSS custom property can hold", () => {
    expect(safeKey("Md. Karim", 0)).toBe("md-karim-0");
    expect(safeKey("City Bank (main)", 1)).toBe("city-bank-main-1");
  });

  it("keeps two names that clean down the same apart", () => {
    expect(safeKey("City Bank", 0)).not.toBe(safeKey("city.bank", 1));
  });

  it("still returns a usable key from a name with nothing to keep", () => {
    expect(safeKey("—", 3)).toBe("slice-3");
    expect(safeKey("", 0)).toBe("slice-0");
  });
});
