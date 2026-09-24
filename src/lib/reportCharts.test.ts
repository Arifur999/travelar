import { describe, expect, it } from "vitest";
import { buildGoalPoints, hasAnyGoal, isGoalSeriesEmpty } from "./reportCharts";
import { type IMonthlyBreakdownRow } from "@/types/dashboard.types";

const row = (
  month: number,
  monthName: string,
  salesGoal = 0,
  actualSales = 0,
): IMonthlyBreakdownRow => ({
  year: 2026,
  month,
  monthName,
  salesGoal,
  actualSales,
  profitGoal: 0,
  actualProfit: 0,
  expenses: 0,
  profitLoss: 0,
  profitWithdraw: 0,
});

describe("buildGoalPoints", () => {
  it("shortens the month for the axis and keeps the full name for the tooltip", () => {
    const [point] = buildGoalPoints([row(1, "January", 100, 90)]);

    expect(point).toEqual({ label: "Jan", fullLabel: "January", goal: 100, actual: 90 });
  });

  it("keeps the months in the order the report gave them", () => {
    const points = buildGoalPoints([row(1, "January"), row(2, "February"), row(3, "March")]);

    expect(points.map((p) => p.label)).toEqual(["Jan", "Feb", "Mar"]);
  });
});

describe("hasAnyGoal", () => {
  it("is true when a single month carries a target", () => {
    expect(hasAnyGoal(buildGoalPoints([row(1, "January"), row(2, "February", 500)]))).toBe(true);
  });

  it("is false when no target was ever set", () => {
    // Drawing the goal line here would put a flat zero across the year, which
    // reads as a target that was beaten rather than one that was never set.
    expect(hasAnyGoal(buildGoalPoints([row(1, "January", 0, 900), row(2, "February", 0, 800)]))).toBe(
      false,
    );
  });
});

describe("isGoalSeriesEmpty", () => {
  it("is true only when neither a goal nor a sale exists all year", () => {
    expect(isGoalSeriesEmpty(buildGoalPoints([row(1, "January"), row(2, "February")]))).toBe(true);
    expect(isGoalSeriesEmpty(buildGoalPoints([row(1, "January", 0, 10)]))).toBe(false);
    expect(isGoalSeriesEmpty(buildGoalPoints([row(1, "January", 10, 0)]))).toBe(false);
  });
});
