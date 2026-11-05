import { describe, expect, it } from "vitest";
import { shownEventChargeAmount, shownEventChargeView } from "@/lib/events/shownEventChargeAmount";

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

  it("names the code and the minor split", () => {
    const view = shownEventChargeView({
      ...base,
      seats: 2,
      minorTickets: 1,
      minorUnitPrice: 4000,
      appliedCode: { code: "FIJO", kind: "amount", discountAmount: 1000, ticketCount: 2 },
    });
    expect(view?.discount).toEqual({ kind: "code", code: "FIJO", percent: null, amountOff: 2000 });
    expect(view?.adultTickets).toBe(1);
    expect(view?.minorTickets).toBe(1);
  });

  it("uses the flow price and leaves the discount empty", () => {
    const view = shownEventChargeView({
      ...base,
      seats: 1,
      minorTickets: 0,
      minorUnitPrice: null,
      priceByFlow: true,
      flowPrice: 8000,
    });
    expect(view?.amount).toBe(8000);
    expect(view?.discount).toBeNull();
  });

  it("ignores flow mode when the flow has no price", () => {
    const amount = shownEventChargeAmount({
      ...base,
      seats: 1,
      minorTickets: 0,
      minorUnitPrice: null,
      priceByFlow: true,
      flowPrice: null,
    });
    expect(amount).toBe(10000);
  });

  it("uses the package price", () => {
    const amount = shownEventChargeAmount({
      ...base,
      seats: 1,
      minorTickets: 0,
      minorUnitPrice: null,
      packagePrice: 7000,
    });
    expect(amount).toBe(7000);
  });

  it("names a percent code and falls back to CLP when currency is blank", () => {
    const view = shownEventChargeView({
      ...base,
      currency: "",
      seats: 1,
      minorTickets: 0,
      minorUnitPrice: null,
      appliedCode: { code: "DIEZ", kind: "percent", percent: 10 },
    });
    expect(view?.amount).toBe(9000);
    expect(view?.discount).toEqual({ kind: "code", code: "DIEZ", percent: 10, amountOff: 1000 });
  });

  it("returns null when the event has no price", () => {
    const parts = {
      ...base,
      price: null,
      seats: 1,
      minorTickets: 0,
      minorUnitPrice: null,
    };
    expect(shownEventChargeView(parts)).toBeNull();
    expect(shownEventChargeAmount(parts)).toBeNull();
  });
});
