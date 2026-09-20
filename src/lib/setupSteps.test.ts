import { describe, expect, it } from "vitest";
import { buildSetupSteps, isSetupComplete, nextSetupStep } from "./setupSteps";
import { type PlanFeature } from "@/types/enums.types";

const ALL: PlanFeature[] = ["TICKETING", "VISA", "HAJJ_UMRAH", "EXPENSE", "REPORTS", "CRM"];
const nothingDone = { hasCashAccount: false, hasCustomer: false, hasSale: false };
const allDone = { hasCashAccount: true, hasCustomer: true, hasSale: true };

describe("buildSetupSteps", () => {
  it("asks for an account, a customer and a sale, in that order", () => {
    const steps = buildSetupSteps(nothingDone, ALL);
    expect(steps.map((s) => s.key)).toEqual(["cashAccount", "customer", "sale"]);
    expect(steps.every((s) => s.done)).toBe(false);
  });

  it("marks what is already done without dropping it", () => {
    const steps = buildSetupSteps({ hasCashAccount: true, hasCustomer: false, hasSale: false }, ALL);
    expect(steps.map((s) => s.done)).toEqual([true, false, false]);
  });

  it("points the sale step at the first sales module the plan includes", () => {
    expect(buildSetupSteps(nothingDone, ALL).at(-1)?.href).toBe("/dashboard/tickets");
    expect(buildSetupSteps(nothingDone, ["VISA", "EXPENSE"]).at(-1)?.href).toBe("/dashboard/visa");
    expect(buildSetupSteps(nothingDone, ["HAJJ_UMRAH"]).at(-1)).toMatchObject({
      href: "/dashboard/hajj",
      action: "Take a booking",
    });
  });

  it("never shows a step the plan does not allow", () => {
    // No EXPENSE: cash accounts are not reachable, so they are not asked for.
    const noMoney = buildSetupSteps(nothingDone, ["TICKETING"]);
    expect(noMoney.map((s) => s.key)).toEqual(["customer", "sale"]);

    // No sales module at all: only the customer step remains.
    const noSales = buildSetupSteps(nothingDone, ["EXPENSE", "REPORTS"]);
    expect(noSales.map((s) => s.key)).toEqual(["cashAccount", "customer"]);

    // A plan with nothing relevant still offers customers, a base feature.
    expect(buildSetupSteps(nothingDone, []).map((s) => s.key)).toEqual(["customer"]);
  });
});

describe("isSetupComplete", () => {
  it("is true once every shown step is done", () => {
    expect(isSetupComplete(buildSetupSteps(allDone, ALL))).toBe(true);
    expect(isSetupComplete(buildSetupSteps({ ...allDone, hasSale: false }, ALL))).toBe(false);
  });

  it("ignores work the plan hides: no sales module means no sale to wait for", () => {
    const steps = buildSetupSteps({ hasCashAccount: true, hasCustomer: true, hasSale: false }, ["EXPENSE"]);
    expect(isSetupComplete(steps)).toBe(true);
  });
});

describe("nextSetupStep", () => {
  it("is the first unfinished step", () => {
    expect(nextSetupStep(buildSetupSteps({ ...nothingDone, hasCashAccount: true }, ALL))?.key).toBe("customer");
  });

  it("is null when there is nothing left", () => {
    expect(nextSetupStep(buildSetupSteps(allDone, ALL))).toBeNull();
  });
});
