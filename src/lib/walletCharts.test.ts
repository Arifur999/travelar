import { describe, expect, it } from "vitest";
import { buildWalletBars, unspentShare } from "./walletCharts";
import { type IWalletHolder } from "@/types/wallet.types";

const holder = (name: string, balance: number, paidIn = balance): IWalletHolder => ({
  customerId: name.toLowerCase(),
  name,
  phone: "01700000000",
  paidIn,
  usedUp: paidIn - balance,
  balance,
});

describe("buildWalletBars", () => {
  it("draws the biggest balances first", () => {
    const { bars } = buildWalletBars([holder("Amin", 2_000), holder("Bashir", 9_000)]);

    expect(bars.map((bar) => bar.label)).toEqual(["Bashir", "Amin"]);
  });

  it("breaks a tie on the name, so the order never shuffles between loads", () => {
    const { bars } = buildWalletBars([holder("Zaman", 500), holder("Amin", 500)]);

    expect(bars.map((bar) => bar.label)).toEqual(["Amin", "Zaman"]);
  });

  it("counts the tail instead of folding it into a bar", () => {
    const many = Array.from({ length: 11 }, (_, i) => holder(`Customer ${i}`, 100 - i));

    const { bars, hiddenCount, hiddenTotal } = buildWalletBars(many, 8);

    expect(bars).toHaveLength(8);
    expect(hiddenCount).toBe(3);
    // 92 + 91 + 90 — the three smallest.
    expect(hiddenTotal).toBe(273);
  });

  it("leaves out a customer whose balance is spent", () => {
    const { bars } = buildWalletBars([holder("Amin", 0, 5_000), holder("Bashir", 100)]);

    expect(bars.map((bar) => bar.label)).toEqual(["Bashir"]);
  });

  it("shortens a name that would not fit a tick", () => {
    const { bars } = buildWalletBars([holder("Mohammad Abdur Rahman Chowdhury", 100)]);

    expect(bars[0]!.label).toHaveLength(18);
    expect(bars[0]!.label.endsWith("…")).toBe(true);
  });
});

describe("unspentShare", () => {
  it("is the part of the deposit no invoice has taken", () => {
    expect(unspentShare(holder("Amin", 2_500, 10_000))).toBe(25);
  });

  it("has nothing to report for a customer who paid in nothing", () => {
    expect(unspentShare(holder("Amin", 0, 0))).toBeNull();
  });
});
