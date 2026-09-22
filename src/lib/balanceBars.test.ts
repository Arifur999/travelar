import { describe, expect, it } from "vitest";
import { buildBalanceBars, collectedShare, type BalanceRow } from "./balanceBars";

const row = (name: string, balance: number): BalanceRow => ({ id: name, name, balance });

describe("buildBalanceBars", () => {
  it("draws the biggest balance first", () => {
    const { bars } = buildBalanceBars([row("Amin", 2_000), row("Bashir", 9_000)]);

    expect(bars.map((bar) => bar.label)).toEqual(["Bashir", "Amin"]);
  });

  it("breaks a tie on the name, so the order never shuffles between loads", () => {
    const { bars } = buildBalanceBars([row("Zaman", 500), row("Amin", 500)]);

    expect(bars.map((bar) => bar.label)).toEqual(["Amin", "Zaman"]);
  });

  it("leaves out anyone who owes nothing or is in credit", () => {
    const { bars } = buildBalanceBars([row("Paid up", 0), row("In credit", -5_000), row("Owes", 10)]);

    expect(bars.map((bar) => bar.label)).toEqual(["Owes"]);
  });

  it("counts the tail instead of folding it into a bar", () => {
    const many = Array.from({ length: 11 }, (_, i) => row(`Customer ${i}`, 100 - i));

    const { bars, hiddenCount, hiddenTotal } = buildBalanceBars(many, 8);

    expect(bars).toHaveLength(8);
    expect(hiddenCount).toBe(3);
    // 92 + 91 + 90 — the three smallest.
    expect(hiddenTotal).toBe(273);
  });

  it("shortens a name that would not fit a tick", () => {
    const { bars } = buildBalanceBars([row("Mohammad Abdur Rahman Chowdhury", 100)]);

    expect(bars[0]!.label).toHaveLength(18);
    expect(bars[0]!.label.endsWith("…")).toBe(true);
  });
});

describe("collectedShare", () => {
  it("is the part of what was billed that came in", () => {
    expect(collectedShare(10_000, 2_500)).toBe(25);
  });

  it("has nothing to report before anything is billed", () => {
    expect(collectedShare(0, 0)).toBeNull();
  });

  it("stops at everything collected, even after an overpayment", () => {
    expect(collectedShare(1_000, 1_500)).toBe(100);
  });
});
