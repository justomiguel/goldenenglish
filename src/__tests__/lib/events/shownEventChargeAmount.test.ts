import { describe, expect, it } from "vitest";
import { shownEventChargeAmount } from "@/lib/events/shownEventChargeAmount";

const base = {
  currency: "CLP",
  isLocalResident: true,
  price: 10000,
  priceLocal: null,
  priceNonLocal: null,
  priceByFlow: false,
  flowPrice: null,
  packagePrice: null,
  familyDiscountClaimed: false,
  appliedCode: null,
};

describe("shownEventChargeAmount", () => {
  it("uses the minor price and the code the form showed", () => {
    const amount = shownEventChargeAmount({
      ...base,
      seats: 2,
      minorTickets: 1,
      minorUnitPrice: 4000,
      appliedCode: { code: "FIJO", kind: "amount", discountAmount: 1000, ticketCount: 2 },
    });
    expect(amount).toBe(12000);
  });

  it("applies the family rate after the minor split", () => {
    const amount = shownEventChargeAmount({
      ...base,
      seats: 2,
      minorTickets: 1,
      minorUnitPrice: 5000,
      familyDiscountClaimed: true,
    });
    expect(amount).toBe(13500);
  });
});
