/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { planTrialRescheduleMoney } from "@/lib/register/planTrialRescheduleMoney";

describe("planTrialRescheduleMoney", () => {
  it("asks for the difference when the new quote is higher", () => {
    expect(
      planTrialRescheduleMoney({
        capturedTotal: 10000,
        newQuoteTotal: 15000,
        currency: "CLP",
      }),
    ).toEqual({ kind: "pay_delta", amount: 5000, currency: "CLP" });
  });

  it("flags a refund when the new quote is lower", () => {
    expect(
      planTrialRescheduleMoney({
        capturedTotal: 20000,
        newQuoteTotal: 8000,
        currency: "CLP",
      }),
    ).toEqual({ kind: "refund_due", amount: 12000, currency: "CLP" });
  });

  it("confirms only when the quote matches or nothing was captured", () => {
    expect(
      planTrialRescheduleMoney({
        capturedTotal: 10000,
        newQuoteTotal: 10000,
        currency: "CLP",
      }),
    ).toEqual({ kind: "confirm" });
    expect(
      planTrialRescheduleMoney({
        capturedTotal: 0,
        newQuoteTotal: 0,
        currency: "CLP",
      }),
    ).toEqual({ kind: "confirm" });
  });
});
