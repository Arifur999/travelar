import { describe, expect, it } from "vitest";
import {
  buildModuleRows,
  totalSalesCount,
  buildAccountBars,
  buildNetPositionBars,
  buildSalesMix,
  buildTrendHighlights,
  firstMetricWithData,
  buildTrendPoints,
  isNetPositionEmpty,
  isTrendEmpty,
  monthOverMonth,
} from "./dashboardCharts";
import {
  type ICashFlow,
  type ICashFlowAccount,
  type IModuleBreakdown,
  type ITrendMonth,
} from "@/types/dashboard.types";

const month = (year: number, m: number, sales = 0, profit = 0, expenses = 0): ITrendMonth => ({
  year,
  month: m,
  sales,
  profit,
  expenses,
});

const account = (id: string, balance: number, isActive = true): ICashFlowAccount => ({
  id,
  name: id,
  category: "CASH",
  isActive,
  balance,
});

describe("buildTrendPoints", () => {
  it("labels months briefly and marks only the last as current", () => {
    const points = buildTrendPoints([month(2026, 4), month(2026, 5), month(2026, 6)]);

    expect(points.map((p) => p.label)).toEqual(["Apr", "May", "Jun"]);
    expect(points.map((p) => p.fullLabel)).toEqual(["April 2026", "May 2026", "June 2026"]);
    expect(points.map((p) => p.isCurrent)).toEqual([false, false, true]);
  });

  it("puts the year on January only when the window crosses a year", () => {
    const points = buildTrendPoints([month(2026, 11), month(2026, 12), month(2027, 1), month(2027, 2)]);
    expect(points.map((p) => p.label)).toEqual(["Nov", "Dec", "Jan 27", "Feb"]);

    // A window that starts in January stays within one year: no suffix.
    expect(buildTrendPoints([month(2027, 1), month(2027, 2)]).map((p) => p.label)).toEqual(["Jan", "Feb"]);
  });
});

describe("isTrendEmpty", () => {
  it("is per metric: expenses alone do not make a sales chart worth drawing", () => {
    const trend = [month(2026, 5, 0, 0, 300), month(2026, 6)];
    expect(isTrendEmpty(trend, "sales")).toBe(true);
    expect(isTrendEmpty(trend, "expenses")).toBe(false);
  });

  it("counts a loss as something to draw", () => {
    expect(isTrendEmpty([month(2026, 6, 0, -500)], "profit")).toBe(false);
  });
});

describe("monthOverMonth", () => {
  it("compares this month to last as a percentage", () => {
    expect(monthOverMonth([month(2026, 5, 1000), month(2026, 6, 1500)], "sales")).toBe(50);
    expect(monthOverMonth([month(2026, 5, 1000), month(2026, 6, 250)], "sales")).toBe(-75);
  });

  it("offers no comparison from a zero month or a single month", () => {
    expect(monthOverMonth([month(2026, 5, 0), month(2026, 6, 900)], "sales")).toBeNull();
    expect(monthOverMonth([month(2026, 6, 900)], "sales")).toBeNull();
  });

  it("reads a recovery from a loss as an improvement", () => {
    // −1,000 to +500 is better, so the sign must be positive.
    expect(monthOverMonth([month(2026, 5, 0, -1000), month(2026, 6, 0, 500)], "profit")).toBe(150);
  });
});

describe("buildTrendHighlights", () => {
  const points = (...months: ITrendMonth[]) => buildTrendPoints(months);

  it("gives this month and the one before it, newest first", () => {
    const result = buildTrendHighlights(
      points(month(2026, 4, 1000), month(2026, 5, 2000), month(2026, 6, 3000)),
      "sales",
    );

    expect(result.map((h) => [h.label, h.value])).toEqual([
      ["June 2026", 3000],
      ["May 2026", 2000],
    ]);
  });

  it("compares each month with the one before it, not with the same one twice", () => {
    // May doubled April; June added half again on May.
    const result = buildTrendHighlights(
      points(month(2026, 4, 1000), month(2026, 5, 2000), month(2026, 6, 3000)),
      "sales",
    );

    expect(result[0].change).toBe(50);
    expect(result[1].change).toBe(100);
  });

  it("marks only the month still in progress", () => {
    const result = buildTrendHighlights(
      points(month(2026, 5, 2000), month(2026, 6, 3000)),
      "sales",
    );

    expect(result.map((h) => h.isCurrent)).toEqual([true, false]);
  });

  it("offers no comparison for the oldest month it has", () => {
    // May is the first point, so nothing precedes it to compare against.
    const result = buildTrendHighlights(points(month(2026, 5, 2000), month(2026, 6, 3000)), "sales");

    expect(result[1].change).toBeNull();
  });

  it("offers no comparison out of a zero month", () => {
    const result = buildTrendHighlights(
      points(month(2026, 4, 0), month(2026, 5, 0), month(2026, 6, 900)),
      "sales",
    );

    expect(result[0].change).toBeNull();
  });

  it("returns one block from a single month and none from nothing", () => {
    expect(buildTrendHighlights(points(month(2026, 6, 900)), "sales")).toHaveLength(1);
    expect(buildTrendHighlights([], "sales")).toEqual([]);
  });

  it("reads the metric it is asked for", () => {
    const result = buildTrendHighlights(
      points(month(2026, 5, 9000, 0, 400), month(2026, 6, 9000, 0, 600)),
      "expenses",
    );

    expect(result[0].value).toBe(600);
    expect(result[0].change).toBe(50);
  });
});

describe("buildSalesMix", () => {
  const byModule = (
    ticketing: number,
    visa: number,
    hajj: number,
    tours = 0,
    hotels = 0,
  ): IModuleBreakdown => ({
    ticketing: { count: 2, sales: ticketing, profit: 0 },
    visa: { count: 1, sales: visa, profit: 0 },
    hajj: { count: 3, sales: hajj, profit: null },
    tours: { count: 4, sales: tours, profit: 0 },
    hotels: { count: 5, sales: hotels, profit: 0 },
  });

  it("gives each selling module its share", () => {
    const slices = buildSalesMix(byModule(6000, 2000, 2000));
    expect(slices.map((s) => [s.label, s.share])).toEqual([
      ["Tickets", 60],
      ["Visa", 20],
      ["Hajj & Umrah", 20],
    ]);
    expect(slices[2].count).toBe(3);
  });

  it("drops modules with no sales, and a module refunds pushed below zero", () => {
    const slices = buildSalesMix(byModule(4000, 0, -500));
    expect(slices).toHaveLength(1);
    expect(slices[0]).toMatchObject({ module: "ticketing", share: 100 });
  });

  it("is empty when nothing sold", () => {
    expect(buildSalesMix(byModule(0, 0, 0))).toEqual([]);
  });
});

describe("buildAccountBars", () => {
  it("shows the largest accounts and folds the rest into one bar", () => {
    const bars = buildAccountBars(
      [account("a", 100), account("b", 900), account("c", 500), account("d", 50), account("e", 20), account("f", 10), account("g", 5)],
      4,
    );

    expect(bars.map((b) => b.name)).toEqual(["b", "c", "a", "Other accounts (4)"]);
    expect(bars[3]).toMatchObject({ balance: 85, accounts: 4 });
  });

  it("shows every account when they fit, and never folds just one away", () => {
    expect(buildAccountBars([account("a", 3), account("b", 2), account("c", 1)], 3).map((b) => b.name)).toEqual([
      "a",
      "b",
      "c",
    ]);

    // One over the limit: two are folded, never "Other accounts (1)".
    const bars = buildAccountBars([account("a", 4), account("b", 3), account("c", 2), account("d", 1)], 3);
    expect(bars.map((b) => b.name)).toEqual(["a", "b", "Other accounts (2)"]);
  });

  it("never draws more bars than the limit unless an account is overdrawn", () => {
    const many = Array.from({ length: 20 }, (_, i) => account(`acc-${i}`, 1000 - i));
    for (const limit of [1, 2, 3, 5, 8]) {
      expect(buildAccountBars(many, limit).length).toBeLessThanOrEqual(limit);
    }
    // And the total is never lost in the folding.
    const total = many.reduce((sum, a) => sum + a.balance, 0);
    expect(buildAccountBars(many, 3).reduce((sum, b) => sum + b.balance, 0)).toBe(total);
  });

  it("always shows an overdrawn account on its own, last", () => {
    const bars = buildAccountBars(
      [account("big", 1000), account("mid", 500), account("small", 100), account("minus", -300)],
      3,
    );

    // The overdraft takes one of the two slots and is never summed into "Other".
    expect(bars.map((b) => b.name)).toEqual(["big", "Other accounts (2)", "minus"]);
    expect(bars.at(-1)).toMatchObject({ name: "minus", balance: -300, isNegative: true });
    expect(bars.find((b) => b.key === "other")?.balance).toBe(600);
  });

  it("keeps overdrafts visible even when they fill every slot", () => {
    const bars = buildAccountBars([account("a", 100), account("b", 50), account("x", -10), account("y", -20)], 1);
    expect(bars.map((b) => b.name)).toEqual(["Other accounts (2)", "x", "y"]);

    const lone = buildAccountBars([account("a", 100), account("x", -10)], 1);
    expect(lone.map((b) => b.name)).toEqual(["a", "x"]);
  });

  it("labels an inactive account so its balance is not mistaken for spendable money", () => {
    expect(buildAccountBars([account("Old till", 40, false)])[0].name).toBe("Old till (inactive)");
  });

  it("draws nothing for an agency with no accounts", () => {
    expect(buildAccountBars([])).toEqual([]);
  });
});


const cashFlow = (over: Partial<ICashFlow> = {}): ICashFlow => ({
  accounts: [],
  accountBalance: 0,
  customerDue: 0,
  totalAssets: 0,
  supplierPayable: 0,
  netCashFlow: 0,
  invested: 0,
  withdrawn: 0,
  netInvestment: 0,
  difference: 0,
  ...over,
});

describe("buildNetPositionBars", () => {
  it("draws what is owed away below the axis", () => {
    const bars = buildNetPositionBars(
      cashFlow({ accountBalance: 50_000, customerDue: 20_000, supplierPayable: 30_000, netCashFlow: 40_000 }),
    );

    expect(bars.map((bar) => [bar.key, bar.value])).toEqual([
      ["cash", 50_000],
      ["receivable", 20_000],
      ["payable", -30_000],
      ["net", 40_000],
    ]);
    expect(bars.find((bar) => bar.key === "payable")?.isNegative).toBe(true);
  });

  it("takes the net from the API rather than adding up again", () => {
    // The Reports page shows the same figure; computing it twice is how two
    // screens end up disagreeing.
    const bars = buildNetPositionBars(cashFlow({ accountBalance: 10, netCashFlow: 999 }));

    expect(bars.find((bar) => bar.key === "net")?.value).toBe(999);
  });

  it("flags an overdrawn balance and a negative net", () => {
    const bars = buildNetPositionBars(cashFlow({ accountBalance: -5, netCashFlow: -5 }));

    expect(bars.find((bar) => bar.key === "cash")?.isNegative).toBe(true);
    expect(bars.find((bar) => bar.key === "net")?.isNegative).toBe(true);
  });

  it("is empty only when every figure is zero", () => {
    expect(isNetPositionEmpty(buildNetPositionBars(cashFlow()))).toBe(true);
    expect(isNetPositionEmpty(buildNetPositionBars(cashFlow({ customerDue: 1 })))).toBe(false);
  });
});

describe("the module list", () => {
  const byModule = {
    ticketing: { count: 2, sales: 6_000, profit: 1_000 },
    visa: { count: 1, sales: 2_000, profit: 800 },
    hajj: { count: 3, sales: 9_000, profit: null as null },
    tours: { count: 4, sales: 4_000, profit: 900 },
    hotels: { count: 5, sales: 5_000, profit: 700 },
  };

  it("gives a row to every module, including the quiet ones", () => {
    const rows = buildModuleRows({ ...byModule, hotels: { count: 0, sales: 0, profit: 0 } });

    // A module that sold nothing still gets a row: its absence from a
    // report reads as "we do not do that", not "nothing sold".
    expect(rows.map((row) => row.label)).toEqual([
      "Tickets",
      "Visa",
      "Hajj & Umrah",
      "Tours",
      "Hotel",
    ]);
  });

  it("carries a missing margin through as null, never as zero", () => {
    const hajj = buildModuleRows(byModule).find((row) => row.module === "hajj");

    expect(hajj?.profit).toBeNull();
  });

  it("counts sales across every module, not the first three", () => {
    expect(totalSalesCount(byModule)).toBe(15);
  });
});

describe("firstMetricWithData", () => {
  it("opens on sales when there are sales", () => {
    expect(firstMetricWithData([month(2026, 5, 1000, 200, 50)])).toBe("sales");
  });

  it("falls through to the first metric that has anything", () => {
    // Nothing sold in the window, but the agency has been paying bills.
    expect(firstMetricWithData([month(2026, 5, 0, 0, 400)])).toBe("expenses");
    expect(firstMetricWithData([month(2026, 5, 0, 300, 0)])).toBe("profit");
  });

  it("stays on sales when nothing at all has happened", () => {
    expect(firstMetricWithData([month(2026, 5)])).toBe("sales");
    expect(firstMetricWithData([])).toBe("sales");
  });

  it("counts a loss as something to draw", () => {
    expect(firstMetricWithData([month(2026, 5, 0, -900, 0)])).toBe("profit");
  });
});
