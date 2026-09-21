import { describe, expect, it } from "vitest";
import { paymentCap, toPaymentPayload } from "./paymentSource";

describe("toPaymentPayload", () => {
  it("sends the account when the money is arriving now", () => {
    const payload = toPaymentPayload({ source: "ACCOUNT" as const, cashAccountId: "acc-1", amount: "500" });

    expect(payload.cashAccountId).toBe("acc-1");
    expect(payload.fromWallet).toBe(false);
  });

  it("drops the account when the balance is paying, so no account is claimed", () => {
    const payload = toPaymentPayload({ source: "WALLET" as const, cashAccountId: "acc-1", amount: "500" });

    expect(payload.cashAccountId).toBeUndefined();
    expect(payload.fromWallet).toBe(true);
  });

  it("carries the rest of the form through untouched", () => {
    const payload = toPaymentPayload({
      source: "ACCOUNT" as const,
      cashAccountId: "acc-1",
      amount: "500",
      method: "CASH",
      note: "Counter",
    });

    expect(payload.amount).toBe("500");
    expect(payload.method).toBe("CASH");
    expect(payload.note).toBe("Counter");
  });
});

describe("paymentCap", () => {
  it("is what the invoice still owes when money is arriving now", () => {
    expect(paymentCap(5_000, "ACCOUNT", 200)).toBe(5_000);
  });

  it("is limited by the balance left when the balance is paying", () => {
    expect(paymentCap(5_000, "WALLET", 1_200)).toBe(1_200);
  });

  it("never exceeds the due, however much the customer is holding", () => {
    expect(paymentCap(800, "WALLET", 50_000)).toBe(800);
  });
});
