import { describe, expect, it } from "vitest";
import {
  formatEventMoneyAmount,
  resolveEventPublicPriceDisplay,
} from "@/lib/events/resolveEventPublicPriceDisplay";

describe("resolveEventPublicPriceDisplay", () => {
  it("returns free when both prices are zero or missing", () => {
    expect(resolveEventPublicPriceDisplay({ price: 0 }, "USD")).toEqual({ kind: "free" });
    expect(resolveEventPublicPriceDisplay({}, "CLP")).toEqual({ kind: "free" });
  });

  it("returns single price when local and non-local match", () => {
    expect(
      resolveEventPublicPriceDisplay({ priceLocal: 25, priceNonLocal: 25 }, "USD"),
    ).toEqual({ kind: "single", amount: 25, currency: "USD" });
  });

  it("returns tiered when local and non-local differ", () => {
    expect(
      resolveEventPublicPriceDisplay({ priceLocal: 20, priceNonLocal: 35 }, "USD"),
    ).toEqual({
      kind: "tiered",
      localAmount: 20,
      nonLocalAmount: 35,
      currency: "USD",
    });
  });

  it("uses legacy price field for single paid events", () => {
    expect(resolveEventPublicPriceDisplay({ price: 15 }, "CLP")).toEqual({
      kind: "single",
      amount: 15,
      currency: "CLP",
    });
  });
});

describe("formatEventMoneyAmount", () => {
  it("formats with locale currency", () => {
    const formatted = formatEventMoneyAmount(1234.5, "USD", "en-US");
    expect(formatted).toContain("1,234.50");
  });

  it("falls back when currency code is invalid", () => {
    expect(formatEventMoneyAmount(10, "NOT_A_CURRENCY", "en-US")).toBe("NOT_A_CURRENCY 10.00");
  });
});
