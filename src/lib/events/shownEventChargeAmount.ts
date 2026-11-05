import type { EventDiscountApplied } from "@/lib/events/resolveEventDiscountSelection";
import { resolveEventRegistrationTotals } from "@/lib/events/resolveEventRegistrationTotals";
import { resolveEventSeatPrice } from "@/lib/events/resolveEventRegistrationTotal";

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

/** Same total the registration form shows. Null when the event has no price. */
export function shownEventChargeAmount(parts: ShownEventChargeParts): number | null {
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
  return totals.finalTotal;
}
