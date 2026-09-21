import { describe, expect, it } from "vitest";
import { buildPayrollMix, buildTopPaidStaff } from "./employeeCharts";
import { type IEmployee } from "@/types/employee.types";

const employee = (id: string, name: string, salary: number, bonus = 0): IEmployee => ({
  id,
  agencyId: "agency",
  name,
  phone: "017",
  joinDate: "2026-01-01",
  isDeleted: false,
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
  isActive: true,
  workingMonths: 1,
  workingDays: 30,
  totalSalary: salary,
  totalBonus: bonus,
  subtotal: salary + bonus,
});

describe("buildTopPaidStaff", () => {
  it("takes the best paid, most first", () => {
    const bars = buildTopPaidStaff(
      [employee("a", "Amin", 5_000), employee("b", "Bilal", 9_000), employee("c", "Chan", 7_000)],
      2,
    );

    expect(bars.map((bar) => bar.name)).toEqual(["Bilal", "Chan"]);
  });

  it("keeps salary and bonus apart so the bar can stack", () => {
    const [bar] = buildTopPaidStaff([employee("a", "Amin", 5_000, 1_500)]);

    expect(bar).toMatchObject({ salary: 5_000, bonus: 1_500, total: 6_500 });
  });

  it("leaves out anyone paid nothing", () => {
    const bars = buildTopPaidStaff([employee("a", "Amin", 0), employee("b", "Bilal", 100)]);

    expect(bars.map((bar) => bar.name)).toEqual(["Bilal"]);
  });

  it("breaks ties by name, so the order does not jump between renders", () => {
    const bars = buildTopPaidStaff([employee("b", "Bilal", 100), employee("a", "Amin", 100)]);

    expect(bars.map((bar) => bar.name)).toEqual(["Amin", "Bilal"]);
  });
});

describe("buildPayrollMix", () => {
  it("splits what has been paid", () => {
    const slices = buildPayrollMix({ totalSalary: 7_500, totalBonus: 2_500 });

    expect(slices.map((slice) => [slice.key, Math.round(slice.share)])).toEqual([
      ["salary", 75],
      ["bonus", 25],
    ]);
  });

  it("drops a half that is zero rather than drawing it", () => {
    const slices = buildPayrollMix({ totalSalary: 1_000, totalBonus: 0 });

    expect(slices.map((slice) => slice.key)).toEqual(["salary"]);
  });

  it("is empty before anyone is paid", () => {
    expect(buildPayrollMix({ totalSalary: 0, totalBonus: 0 })).toEqual([]);
  });
});
