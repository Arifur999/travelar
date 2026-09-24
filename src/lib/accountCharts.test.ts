import { describe, expect, it } from "vitest";
import { buildSourceFlow, isSourceFlowEmpty } from "./accountCharts";
import { type IAccountOverviewRow } from "@/types/account.types";
import { type PostingSource } from "@/types/enums.types";

const ORDER: PostingSource[] = ["OPENING", "SALES_PAYMENT", "EXPENSE", "SUPPLIER_PAYMENT"];

const row = (
  id: string,
  bySource: Partial<Record<PostingSource, number>>,
): IAccountOverviewRow => ({
  id,
  name: id,
  category: "SALES_BUYING",
  isActive: true,
  openingBalance: 0,
  totalIn: 0,
  totalOut: 0,
  currentBalance: 0,
  bySource,
});

describe("buildSourceFlow", () => {
  it("adds a source up across every account", () => {
    const bars = buildSourceFlow(
      [row("cash", { SALES_PAYMENT: 1000 }), row("bank", { SALES_PAYMENT: 2500 })],
      ORDER,
    );

    expect(bars).toEqual([
      { key: "SALES_PAYMENT", label: "Sales payment", value: 3500, isNegative: false },
    ]);
  });

  it("treats a source absent from one account as zero there, not as skipped", () => {
    // bKash has no expenses at all; the total must still be the other two.
    const bars = buildSourceFlow(
      [row("cash", { EXPENSE: -400 }), row("bkash", {}), row("bank", { EXPENSE: -600 })],
      ORDER,
    );

    expect(bars.map((b) => b.value)).toEqual([-1000]);
  });

  it("keeps money out below the axis and marks it", () => {
    const bars = buildSourceFlow([row("cash", { SALES_PAYMENT: 900, EXPENSE: -250 })], ORDER);

    expect(bars.map((b) => [b.key, b.value, b.isNegative])).toEqual([
      ["SALES_PAYMENT", 900, false],
      ["EXPENSE", -250, true],
    ]);
  });

  it("follows the order it is given, not the order the data arrived in", () => {
    const bars = buildSourceFlow([row("cash", { EXPENSE: -10, OPENING: 50 })], ORDER);

    expect(bars.map((b) => b.key)).toEqual(["OPENING", "EXPENSE"]);
  });

  it("drops a source that nets to exactly zero", () => {
    // Paid in and taken straight back out: a bar of no height, with thirteen
    // sources competing for the width.
    const bars = buildSourceFlow(
      [row("cash", { SALES_PAYMENT: 500 }), row("bank", { SALES_PAYMENT: -500 })],
      ORDER,
    );

    expect(bars).toEqual([]);
  });

  it("is empty when no account has moved anything", () => {
    expect(isSourceFlowEmpty(buildSourceFlow([row("cash", {})], ORDER))).toBe(true);
    expect(isSourceFlowEmpty(buildSourceFlow([], ORDER))).toBe(true);
  });
});
