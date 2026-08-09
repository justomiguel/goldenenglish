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

  describe("package mode", () => {
    const packages = [
      { id: "b", name: "General", price: 5000, benefits: ["Entrada"], remainingSeats: 12 },
      { id: "a", name: "VIP", price: 12000, benefits: ["Entrada", "Cena"], remainingSeats: null },
    ];

    it("shows the packages instead of the residency tiers", () => {
      expect(
        resolveEventPublicPriceDisplay({ priceLocal: 20, priceNonLocal: 35 }, "USD", packages),
      ).toEqual({ kind: "packages", currency: "USD", packages });
    });

    it("keeps the order it was given, which is the admin's order", () => {
      const result = resolveEventPublicPriceDisplay({}, "USD", packages);
      expect(result.kind === "packages" && result.packages.map((p) => p.id)).toEqual(["b", "a"]);
    });

    it("takes over even for an event whose flat price is zero", () => {
      expect(resolveEventPublicPriceDisplay({ price: 0 }, "USD", packages).kind).toBe("packages");
    });

    it("changes nothing for an event with no packages", () => {
      // Every event that exists today goes through here, so this is the
      // regression that matters most in this file.
      expect(resolveEventPublicPriceDisplay({ price: 0 }, "USD", [])).toEqual({ kind: "free" });
      expect(resolveEventPublicPriceDisplay({ price: 15 }, "CLP", [])).toEqual({
        kind: "single",
        amount: 15,
        currency: "CLP",
      });
      expect(resolveEventPublicPriceDisplay({ priceLocal: 20, priceNonLocal: 35 }, "USD")).toEqual({
        kind: "tiered",
        localAmount: 20,
        nonLocalAmount: 35,
        currency: "USD",
      });
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
