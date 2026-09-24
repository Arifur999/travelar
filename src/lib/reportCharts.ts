import { type IMonthlyBreakdownRow } from "@/types/dashboard.types";

/**
 * Shapes the yearly report into what its chart draws.
 *
 * Kept free of React so the one decision that matters — what to do with a year
 * whose goals were never set — has a test rather than a guess.
 */

export interface GoalPoint {
  /** Short axis label: "Jan". */
  label: string;
  /** Tooltip label: "January". */
  fullLabel: string;
  goal: number;
  actual: number;
}

export const buildGoalPoints = (months: IMonthlyBreakdownRow[]): GoalPoint[] =>
  months.map((row) => ({
    label: row.monthName.slice(0, 3),
    fullLabel: row.monthName,
    goal: row.salesGoal,
    actual: row.actualSales,
  }));

/**
 * True when no month in the year has a goal set.
 *
 * Without this the chart draws a goal line flat along zero, which reads as
 * "the target was nothing and you beat it" rather than "no target was set".
 */
export const hasAnyGoal = (points: GoalPoint[]): boolean =>
  points.some((point) => point.goal > 0);

/** True when there is nothing at all to draw for the year. */
export const isGoalSeriesEmpty = (points: GoalPoint[]): boolean =>
  points.every((point) => point.goal === 0 && point.actual === 0);
