import type { EventDiscountApplied } from "@/lib/events/resolveEventDiscountSelection";
import { resolveEventRegistrationTotals } from "@/lib/events/resolveEventRegistrationTotals";
import { resolveEventSeatPrice } from "@/lib/events/resolveEventRegistrationTotal";

export type ShownEventChargeDiscount =
  | { kind: "code"; code: string; percent: number | null; amountOff: number }
  | { kind: "family"; amountOff: number };

export interface ShownEventChargeView {
  amount: number;
  adultTickets: number;
  unitPrice: number | null;
  minorTickets: number;
  minorUnitPrice: number | null;
  discount: ShownEventChargeDiscount | null;
}

export interface ShownEventChargeParts {
  currency: string;
  isLocalResident: boolean;
  price: number | null;
  priceLocal: number | null;
  priceNonLocal: number | null;
  priceByFlow: boolean;
  flowPrice: number | null;
  packagePrice: number | null;
  seats: number;
  minorTickets: number;
  minorUnitPrice: number | null;
  familyDiscountClaimed: boolean;
  appliedCode: EventDiscountApplied | null;
}

/** Same total and discount lines the registration form shows. Null when the event has no price. */
export function shownEventChargeView(parts: ShownEventChargeParts): ShownEventChargeView | null {
  const flow =
    parts.priceByFlow && parts.flowPrice != null ? { price: parts.flowPrice } : null;
  const unitPrice = resolveEventSeatPrice(
    {
      price: parts.price,
      priceLocal: parts.priceLocal,
      priceNonLocal: parts.priceNonLocal,
    },
    parts.packagePrice != null ? { price: parts.packagePrice } : null,
    parts.isLocalResident,
    flow,
  );
  const totals = resolveEventRegistrationTotals({
    unitPrice,
    seats: Math.max(1, parts.seats),
    currency: parts.currency || "CLP",
    familyDiscountClaimed: parts.familyDiscountClaimed && parts.appliedCode == null,
    appliedCode: parts.appliedCode,
    minorTickets: parts.minorTickets,
    minorUnitPrice: parts.minorUnitPrice,
  });
  if (totals.finalTotal == null || totals.subtotal == null) return null;
  const amountOff = Math.max(0, totals.subtotal - totals.finalTotal);
  const code = parts.appliedCode;
  const discount: ShownEventChargeDiscount | null =
    code && amountOff > 0
      ? {
          kind: "code",
          code: code.code,
          percent: code.kind === "percent" ? code.percent : null,
          amountOff,
        }
      : parts.familyDiscountClaimed && code == null && amountOff > 0
        ? { kind: "family", amountOff }
        : null;
  return {
    amount: totals.finalTotal,
    adultTickets: totals.adultTickets,
    unitPrice: totals.unitPrice,
    minorTickets: totals.minorTickets,
    minorUnitPrice: totals.minorUnitPrice,
    discount,
  };
}

/** Same total the registration form shows. Null when the event has no price. */
export function shownEventChargeAmount(parts: ShownEventChargeParts): number | null {
  return shownEventChargeView(parts)?.amount ?? null;
}
