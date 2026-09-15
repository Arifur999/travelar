import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  calculateMarginPercent,
  daysUntil,
  formatCurrency,
  formatCurrencyCompact,
  formatDate,
  formatDateForInput,
  getInitials,
  toNumber,
  truncate,
} from "./format";

describe("toNumber", () => {
  // Prisma Decimal columns arrive as strings from some endpoints.
  it("reads numbers and numeric strings", () => {
    expect(toNumber(1500)).toBe(1500);
    expect(toNumber("1500.50")).toBe(1500.5);
  });

  it("falls back to zero for anything unusable", () => {
    for (const value of [null, undefined, "", "abc", NaN, Infinity, {}, []]) {
      expect(toNumber(value)).toBe(0);
    }
  });
});

describe("formatCurrency", () => {
  it("uses the Taka sign and two decimals", () => {
    expect(formatCurrency(150000)).toBe("৳150,000.00");
    expect(formatCurrency("42500.5")).toBe("৳42,500.50");
  });

  it("keeps the sign of a negative figure", () => {
    expect(formatCurrency(-500)).toBe("-৳500.00");
  });

  it("drops decimals when asked for whole units", () => {
    expect(formatCurrency(1234.56, { whole: true })).toBe("৳1,235");
  });
});

describe("formatCurrencyCompact", () => {
  it("reads in lakh and crore, not thousands and millions", () => {
    expect(formatCurrencyCompact(950)).toBe("৳950");
    expect(formatCurrencyCompact(12_500)).toBe("৳12.5K");
    expect(formatCurrencyCompact(1_370_000)).toBe("৳13.70L");
    expect(formatCurrencyCompact(24_000_000)).toBe("৳2.40Cr");
    expect(formatCurrencyCompact(-150_000)).toBe("-৳1.50L");
  });
});

describe("calculateMarginPercent", () => {
  it("is profit as a share of revenue", () => {
    expect(calculateMarginPercent(967_569, 14_674_955)).toBeCloseTo(6.593, 2);
  });

  // A tile showing 0.0% for an agency with no sales would read as a real zero.
  it("is null, not zero, when there is no revenue", () => {
    expect(calculateMarginPercent(0, 0)).toBeNull();
    expect(calculateMarginPercent(100, "0")).toBeNull();
  });
});

describe("dates", () => {
  it("formats API ISO strings and Date objects alike", () => {
    expect(formatDate("2026-09-01T00:00:00.000Z")).toBe("01 Sep 2026");
    expect(formatDate(new Date("2026-12-25T10:00:00Z"))).toBe("25 Dec 2026");
  });

  it("shows the fallback for null and garbage", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate("not a date", "n/a")).toBe("n/a");
    expect(formatDateForInput(undefined)).toBe("");
  });

  it("gives a date input the only format it accepts", () => {
    expect(formatDateForInput("2026-09-01T00:00:00.000Z")).toBe("2026-09-01");
  });
});

describe("daysUntil", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-15T12:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  // A trial with hours left must not read "0 days", which looks lapsed.
  it("rounds a part day up", () => {
    expect(daysUntil("2026-09-15T16:00:00Z")).toBe(1);
    expect(daysUntil("2026-09-22T12:00:00Z")).toBe(7);
  });

  it("floors at zero once passed, and is null without a date", () => {
    expect(daysUntil("2026-09-01T00:00:00Z")).toBe(0);
    expect(daysUntil(null)).toBeNull();
  });
});

describe("strings", () => {
  it("builds initials from at most two words", () => {
    expect(getInitials("Arifur Rahman")).toBe("AR");
    expect(getInitials("  mohammad abdul karim ")).toBe("MA");
    expect(getInitials("   ")).toBe("?");
  });

  it("truncates with an ellipsis inside the limit", () => {
    expect(truncate("Short", 10)).toBe("Short");
    expect(truncate("A much longer label", 10)).toBe("A much lo…");
    expect(truncate("A much longer label", 10)).toHaveLength(10);
  });
});
