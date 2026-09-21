import { describe, expect, it } from "vitest";
import { buildCategorySlices, isCategoryMixEmpty } from "./expenseCharts";
import { type IExpenseCategoryBreakdown } from "@/types/expense.types";

const category = (id: string, name: string, total: number): IExpenseCategoryBreakdown => ({
  id,
  name,
  color: null,
  total,
  thisMonth: 0,
  monthlyBudget: 0,
  yearlyBudget: 0,
  percentUsedMonth: 0,
  shareOfTotal: 0,
});

describe("buildCategorySlices", () => {
  it("orders by spend and shares add up to the whole", () => {
    const slices = buildCategorySlices([
      category("a", "Office", 2_000),
      category("b", "Fuel", 6_000),
      category("c", "Tea", 2_000),
    ]);

    expect(slices.map((slice) => slice.name)).toEqual(["Fuel", "Office", "Tea"]);
    expect(slices.map((slice) => Math.round(slice.share))).toEqual([60, 20, 20]);
  });

  it("drops categories with nothing spent", () => {
    const slices = buildCategorySlices([category("a", "Fuel", 500), category("b", "Unused", 0)]);

    expect(slices.map((slice) => slice.name)).toEqual(["Fuel"]);
  });

  it("folds the tail once it saves at least two slices", () => {
    const many = Array.from({ length: 8 }, (_, i) => category(`c${i}`, `Cat ${i}`, 100 - i));

    const slices = buildCategorySlices(many, 5);

    expect(slices).toHaveLength(6);
    expect(slices.at(-1)).toMatchObject({ key: "other", name: "Other (3)", categories: 3 });
    // Still the whole: five shown plus the folded tail.
    expect(Math.round(slices.reduce((sum, slice) => sum + slice.share, 0))).toBe(100);
  });

  it("leaves a single extra category alone rather than calling it Other (1)", () => {
    const six = Array.from({ length: 6 }, (_, i) => category(`c${i}`, `Cat ${i}`, 10));

    const slices = buildCategorySlices(six, 5);

    expect(slices).toHaveLength(6);
    expect(slices.some((slice) => slice.key === "other")).toBe(false);
  });

  it("is empty when nothing has been spent, categories or not", () => {
    expect(isCategoryMixEmpty(buildCategorySlices([]))).toBe(true);
    expect(isCategoryMixEmpty(buildCategorySlices([category("a", "Fuel", 0)]))).toBe(true);
    expect(isCategoryMixEmpty(buildCategorySlices([category("a", "Fuel", 1)]))).toBe(false);
  });
});
