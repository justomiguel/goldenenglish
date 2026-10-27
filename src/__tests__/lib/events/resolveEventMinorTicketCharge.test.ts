import { describe, expect, it } from "vitest";
import {
  finalizeEnrollCharge,
  resolveEventMinorTicketCharge,
} from "@/lib/events/resolveEventMinorTicketCharge";
import { resolveEventRegistrationTotals } from "@/lib/events/resolveEventRegistrationTotals";

describe("resolveEventMinorTicketCharge", () => {
  it("prices adult seats and minor seats apart", () => {
    const charge = resolveEventMinorTicketCharge({
      seats: 3,
      minorTickets: 1,
      adultUnitPrice: 8000,
      minorUnitPrice: 4000,
      allowMinorTickets: true,
    });
    expect(charge).toEqual({ ok: true, adultTickets: 2, minorTickets: 1, subtotal: 20000 });
  });

  it("rejects a minor count above the purchase", () => {
    const charge = resolveEventMinorTicketCharge({
      seats: 1,
      minorTickets: 2,
      adultUnitPrice: 8000,
      minorUnitPrice: 4000,
      allowMinorTickets: true,
    });
    expect(charge).toEqual({ ok: false, reason: "minor_count_invalid" });
  });

  it("rejects minors when the event does not allow them", () => {
    const charge = resolveEventMinorTicketCharge({
      seats: 2,
      minorTickets: 1,
      adultUnitPrice: 8000,
      minorUnitPrice: 4000,
      allowMinorTickets: false,
    });
    expect(charge).toEqual({ ok: false, reason: "minors_not_allowed" });
  });
});

describe("resolveEventRegistrationTotals minor split", () => {
  it("puts the minor price in the subtotal before a family discount", () => {
    const totals = resolveEventRegistrationTotals({
      unitPrice: 10000,
      seats: 2,
      minorTickets: 1,
      minorUnitPrice: 5000,
      currency: "CLP",
      familyDiscountClaimed: true,
      appliedCode: null,
    });
    expect(totals.subtotal).toBe(15000);
    expect(totals.finalTotal).toBe(13500);
    expect(totals.minorTickets).toBe(1);
    expect(totals.adultTickets).toBe(1);
  });

  it("applies a fixed amount, a percent, or no discount", () => {
    const base = { unitPrice: 10000, seats: 2, currency: "CLP", familyDiscountClaimed: false };
    const withMinors = resolveEventRegistrationTotals({
      ...base,
      minorTickets: 1,
      minorUnitPrice: 4000,
      appliedCode: { code: "FIJO", kind: "amount", discountAmount: 1000, ticketCount: 2 },
    });
    expect(withMinors.finalTotal).toBe(12000);
    expect(withMinors.discountBadge).toBe("-1000 (FIJO)");

    const adultsOnly = resolveEventRegistrationTotals({
      ...base,
      appliedCode: { code: "FIJO", kind: "amount", discountAmount: 1000, ticketCount: 1 },
    });
    expect(adultsOnly.fixedAmount).toMatchObject({ covered: 1, extra: 1, newUnit: 9000 });
    expect(adultsOnly.finalTotal).toBe(19000);

    const percent = resolveEventRegistrationTotals({
      ...base,
      familyDiscountClaimed: true,
      appliedCode: { code: "DIEZ", kind: "percent", percent: 10 },
    });
    expect(percent.finalTotal).toBe(18000);
    expect(percent.discountBadge).toBe("-10% (DIEZ)");

    const plain = resolveEventRegistrationTotals({ ...base, appliedCode: null });
    expect(plain.finalTotal).toBe(20000);
    expect(plain.hasDiscount).toBe(false);

    const unpriced = resolveEventRegistrationTotals({ ...base, unitPrice: null, seats: 0, appliedCode: null });
    expect(unpriced.seats).toBe(1);
    expect(unpriced.finalTotal).toBeNull();

    const rejected = resolveEventRegistrationTotals({
      ...base,
      minorTickets: 3,
      minorUnitPrice: 4000,
      appliedCode: null,
    });
    expect(rejected.finalTotal).toBe(10000);

    const freeMinors = resolveEventRegistrationTotals({
      ...base,
      seats: 1,
      minorTickets: 1,
      minorUnitPrice: 0,
      appliedCode: null,
    });
    expect(freeMinors.finalTotal).toBe(0);
  });
});

describe("finalizeEnrollCharge", () => {
  it("confirms a purchase when every seat is a free minor", () => {
    const charge = finalizeEnrollCharge({
      rpcTotal: 8000,
      rpcStatus: "pending_payment",
      rpcPaymentRequired: true,
      seats: 1,
      flowUnitPrice: null,
      flowStatus: null,
      flowPaymentRequired: null,
      minorTickets: 1,
      minorUnitPrice: 0,
      allowMinorTickets: true,
      discountCode: false,
      familyClaimed: false,
      currency: "CLP",
    });
    expect(charge.ok).toBe(true);
    if (!charge.ok) return;
    expect(charge.totalAmount).toBe(0);
    expect(charge.statusPatch).toBe("confirmed");
    expect(charge.paymentRequired).toBe(false);
  });

  it("keeps the gateway total when there are no minor tickets", () => {
    const charge = finalizeEnrollCharge({
      rpcTotal: null,
      rpcStatus: "pending_payment",
      rpcPaymentRequired: true,
      seats: 0,
      flowUnitPrice: 8000,
      flowStatus: "pending_payment",
      flowPaymentRequired: true,
      minorTickets: 0,
      minorUnitPrice: null,
      allowMinorTickets: false,
      discountCode: false,
      familyClaimed: true,
      currency: "CLP",
    });
    expect(charge).toMatchObject({ ok: true, totalAmount: 7200, statusPatch: "pending_payment" });
  });

  it("keeps the rpc total for a waitlist or a discount code", () => {
    const charge = finalizeEnrollCharge({
      rpcTotal: 5000,
      rpcStatus: "waitlist",
      rpcPaymentRequired: false,
      seats: 2,
      flowUnitPrice: 8000,
      flowStatus: "pending_payment",
      flowPaymentRequired: true,
      minorTickets: 1,
      minorUnitPrice: 4000,
      allowMinorTickets: true,
      discountCode: true,
      familyClaimed: false,
      currency: "CLP",
    });
    expect(charge).toMatchObject({ ok: true, totalAmount: 5000, attendeeStatus: "waitlist", statusPatch: null });
  });

  it("rejects a minor count the event cannot price", () => {
    const charge = finalizeEnrollCharge({
      rpcTotal: 8000,
      rpcStatus: "pending_payment",
      rpcPaymentRequired: true,
      seats: 1,
      flowUnitPrice: null,
      flowStatus: null,
      flowPaymentRequired: null,
      minorTickets: 1,
      minorUnitPrice: null,
      allowMinorTickets: true,
      discountCode: false,
      familyClaimed: false,
      currency: "CLP",
    });
    expect(charge).toEqual({ ok: false, reason: "minor_price_missing" });
  });
});
