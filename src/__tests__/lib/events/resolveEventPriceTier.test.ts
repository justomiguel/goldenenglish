import { describe, expect, it } from "vitest";
import {
  eventHasTieredPricing,
  eventRequiresPayment,
  resolveEventLocalPrice,
  resolveEventNonLocalPrice,
  resolveEventPriceForResidency,
} from "@/lib/events/resolveEventPriceTier";

describe("resolveEventPriceTier", () => {
  it("falls back non-local price to local when unset", () => {
    expect(resolveEventLocalPrice({ priceLocal: 10000 })).toBe(10000);
    expect(resolveEventNonLocalPrice({ priceLocal: 10000 })).toBe(10000);
    expect(eventHasTieredPricing({ priceLocal: 10000 })).toBe(false);
  });

  it("detects tiered pricing when local and non-local differ", () => {
    expect(eventHasTieredPricing({ priceLocal: 5000, priceNonLocal: 8000 })).toBe(true);
    expect(resolveEventPriceForResidency({ priceLocal: 5000, priceNonLocal: 8000 }, true)).toBe(5000);
    expect(resolveEventPriceForResidency({ priceLocal: 5000, priceNonLocal: 8000 }, false)).toBe(8000);
  });

  it("treats free events as no payment required", () => {
    expect(eventRequiresPayment({ priceLocal: 0, priceNonLocal: 0 }, true)).toBe(false);
    expect(eventRequiresPayment({ priceLocal: null, priceNonLocal: null }, false)).toBe(false);
  });
});
