import { describe, expect, it } from "vitest";
import { applyEventFamilyDiscount } from "@/lib/events/applyEventFamilyDiscount";

describe("applyEventFamilyDiscount", () => {
  it("returns the original total when the family discount is not claimed", () => {
    expect(applyEventFamilyDiscount({ amount: 10000, claimed: false, currency: "CLP" })).toBe(10000);
  });

  it("takes 10% off and rounds CLP to a whole unit", () => {
    expect(applyEventFamilyDiscount({ amount: 10000, claimed: true, currency: "CLP" })).toBe(9000);
    expect(applyEventFamilyDiscount({ amount: 1, claimed: true, currency: "ARS" })).toBe(1);
  });

  it("keeps a free registration free", () => {
    expect(applyEventFamilyDiscount({ amount: 0, claimed: true, currency: "CLP" })).toBe(0);
  });

  it("rounds other currencies to two decimals", () => {
    expect(applyEventFamilyDiscount({ amount: 10.05, claimed: true, currency: "USD" })).toBe(9.05);
  });
});
