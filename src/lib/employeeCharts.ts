import { type IEmployee } from "@/types/employee.types";

/**
 * Shapes the employee dashboard into what its charts draw. Free of React so
 * the decisions worth testing — who counts, how ties break, what "nothing paid
 * yet" looks like — are covered by unit tests.
 */

export interface PaidStaffBar {
  key: string;
  name: string;
  salary: number;
  bonus: number;
  total: number;
}

/**
 * The `limit` best-paid staff, salary and bonus kept apart so the bar can be
 * stacked.
 *
 * Anyone paid nothing is left out: a zero-length bar is not a fact about a
 * person, and the list page shows everyone. Resigned staff stay in — the chart
 * is about money that has left the business, not about who works here.
 */
export const buildTopPaidStaff = (employees: IEmployee[], limit = 5): PaidStaffBar[] =>
  employees
    .filter((employee) => employee.subtotal > 0)
    .sort((a, b) => b.subtotal - a.subtotal || a.name.localeCompare(b.name))
    .slice(0, limit)
    .map((employee) => ({
      key: employee.id,
      name: employee.name,
      salary: employee.totalSalary,
      bonus: employee.totalBonus,
      total: employee.subtotal,
    }));

export interface PayrollSlice {
  key: "salary" | "bonus";
  label: string;
  value: number;
  /** Percent of everything paid, 0–100. */
  share: number;
}

/** Salary against bonus. Empty when nothing has been paid at all. */
export const buildPayrollMix = (totals: { totalSalary: number; totalBonus: number }): PayrollSlice[] => {
  const total = totals.totalSalary + totals.totalBonus;
  if (total <= 0) return [];

  return [
    {
      key: "salary",
      label: "Salary",
      value: totals.totalSalary,
      share: (totals.totalSalary / total) * 100,
    },
    { key: "bonus", label: "Bonus", value: totals.totalBonus, share: (totals.totalBonus / total) * 100 },
  ].filter((slice) => slice.value > 0) as PayrollSlice[];
};
