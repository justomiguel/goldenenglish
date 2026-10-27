import { applyEventFamilyDiscount } from "@/lib/events/applyEventFamilyDiscount";

export type EventMinorTicketReject = "minors_not_allowed" | "minor_count_invalid" | "minor_price_missing";

export type EventMinorTicketCharge =
  | { ok: true; adultTickets: number; minorTickets: number; subtotal: number }
  | { ok: false; reason: EventMinorTicketReject };

/** Adult seats keep the event unit price. Minor seats use the admin minor price. */
export function resolveEventMinorTicketCharge(input: {
  seats: number;
  minorTickets: number;
  adultUnitPrice: number | null;
  minorUnitPrice: number | null;
  allowMinorTickets: boolean;
}): EventMinorTicketCharge {
  const seats = Math.floor(input.seats);
  const minorTickets = Math.floor(input.minorTickets);
  if (!Number.isFinite(seats) || seats < 1) return { ok: false, reason: "minor_count_invalid" };
  if (!Number.isFinite(minorTickets) || minorTickets < 0 || minorTickets > seats) {
    return { ok: false, reason: "minor_count_invalid" };
  }
  if (minorTickets > 0 && !input.allowMinorTickets) return { ok: false, reason: "minors_not_allowed" };
  if (
    minorTickets > 0 &&
    (input.minorUnitPrice == null || !Number.isFinite(input.minorUnitPrice) || input.minorUnitPrice < 0)
  ) {
    return { ok: false, reason: "minor_price_missing" };
  }

  const adultTickets = seats - minorTickets;
  const adultUnit = input.adultUnitPrice ?? 0;
  const minorUnit = minorTickets > 0 ? (input.minorUnitPrice ?? 0) : 0;
  return {
    ok: true,
    adultTickets,
    minorTickets,
    subtotal: adultTickets * adultUnit + minorTickets * minorUnit,
  };
}

export function finalizeEnrollCharge(input: {
  rpcTotal: number | null;
  rpcStatus: string | null;
  rpcPaymentRequired: boolean;
  seats: number;
  flowUnitPrice: number | null;
  flowStatus: string | null;
  flowPaymentRequired: boolean | null;
  minorTickets: number;
  minorUnitPrice: number | null;
  allowMinorTickets: boolean;
  discountCode: boolean;
  familyClaimed: boolean;
  currency: string;
}):
  | {
      ok: true;
      totalAmount: number | null;
      attendeeStatus: string | null;
      paymentRequired: boolean;
      statusPatch: string | null;
      minorTickets: number;
    }
  | { ok: false; reason: EventMinorTicketReject } {
  const adultUnit =
    input.flowUnitPrice != null
      ? input.flowUnitPrice
      : input.seats > 0 && input.rpcTotal != null
        ? input.rpcTotal / input.seats
        : 0;
  const priced = resolveEventMinorTicketCharge({
    seats: Math.max(1, input.seats),
    minorTickets: input.minorTickets,
    adultUnitPrice: adultUnit,
    minorUnitPrice: input.minorUnitPrice,
    allowMinorTickets: input.allowMinorTickets,
  });
  if (!priced.ok) return priced;

  if (priced.minorTickets === 0) {
    const base = input.flowUnitPrice != null ? input.flowUnitPrice * Math.max(1, input.seats) : input.rpcTotal;
    const totalAmount = input.discountCode
      ? input.rpcTotal
      : base == null
        ? null
        : applyEventFamilyDiscount({ amount: base, claimed: input.familyClaimed, currency: input.currency });
    const useFlow = !input.discountCode && input.flowStatus != null;
    return {
      ok: true,
      totalAmount,
      attendeeStatus: useFlow ? input.flowStatus : input.rpcStatus,
      paymentRequired: useFlow ? Boolean(input.flowPaymentRequired) : input.rpcPaymentRequired,
      statusPatch: useFlow ? input.flowStatus : null,
      minorTickets: 0,
    };
  }

  if (input.discountCode || input.rpcStatus === "waitlist") {
    return {
      ok: true,
      totalAmount: input.rpcTotal,
      attendeeStatus: input.rpcStatus,
      paymentRequired: input.rpcPaymentRequired,
      statusPatch: null,
      minorTickets: priced.minorTickets,
    };
  }

  const totalAmount = applyEventFamilyDiscount({
    amount: priced.subtotal,
    claimed: input.familyClaimed,
    currency: input.currency,
  });
  const statusPatch = totalAmount <= 0 ? "confirmed" : "pending_payment";
  return {
    ok: true,
    totalAmount,
    attendeeStatus: statusPatch,
    paymentRequired: statusPatch === "pending_payment",
    statusPatch,
    minorTickets: priced.minorTickets,
  };
}
