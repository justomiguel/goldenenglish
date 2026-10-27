import { applyEventCodeDiscount } from "@/lib/events/applyEventCodeDiscount";
import { applyEventFamilyDiscount } from "@/lib/events/applyEventFamilyDiscount";
import { applyEventFixedAmountDiscount, roundEventMoney } from "@/lib/events/applyEventFixedAmountDiscount";
import { resolveEventMinorTicketCharge } from "@/lib/events/resolveEventMinorTicketCharge";
import type { EventDiscountApplied } from "@/lib/events/resolveEventDiscountSelection";

export interface EventFixedAmountBreakdown {
  covered: number;
  extra: number;
  newUnit: number;
  discountAmount: number;
  unitPrice: number;
}

export interface EventRegistrationTotals {
  unitPrice: number | null;
  seats: number;
  adultTickets: number;
  minorTickets: number;
  minorUnitPrice: number | null;
  subtotal: number | null;
  finalTotal: number | null;
  hasDiscount: boolean;
  discountBadge: string | null;
  fixedAmount: EventFixedAmountBreakdown | null;
}

export function resolveEventRegistrationTotals(input: {
  unitPrice: number | null;
  seats: number;
  currency: string;
  familyDiscountClaimed: boolean;
  appliedCode: EventDiscountApplied | null;
  minorTickets?: number;
  minorUnitPrice?: number | null;
}): EventRegistrationTotals {
  const seats = Math.max(1, input.seats);
  const minorTickets = input.minorTickets ?? 0;
  const minorUnitPrice = input.minorUnitPrice ?? null;
  const priced = resolveEventMinorTicketCharge({
    seats,
    minorTickets,
    adultUnitPrice: input.unitPrice,
    minorUnitPrice,
    allowMinorTickets: minorTickets === 0 || minorUnitPrice != null,
  });
  const adultTickets = priced.ok ? priced.adultTickets : seats;
  const acceptedMinors = priced.ok ? priced.minorTickets : 0;
  const empty = {
    unitPrice: input.unitPrice,
    seats,
    adultTickets,
    minorTickets: acceptedMinors,
    minorUnitPrice,
    hasDiscount: false,
    discountBadge: null,
    fixedAmount: null,
  };
  if (!priced.ok || (priced.subtotal <= 0 && acceptedMinors === 0 && (input.unitPrice == null || input.unitPrice <= 0))) {
    return { ...empty, subtotal: input.unitPrice, finalTotal: input.unitPrice };
  }
  if (priced.subtotal <= 0) {
    return { ...empty, subtotal: 0, finalTotal: 0 };
  }

  const subtotal = priced.subtotal;
  let finalTotal = subtotal;
  let discountBadge: string | null = null;
  let fixedAmount: EventFixedAmountBreakdown | null = null;

  if (input.appliedCode?.kind === "amount" && acceptedMinors > 0) {
    const covered = Math.min(seats, Math.max(0, Math.floor(input.appliedCode.ticketCount)));
    finalTotal = roundEventMoney(
      Math.max(0, subtotal - covered * input.appliedCode.discountAmount),
      input.currency,
    );
    discountBadge = `-${input.appliedCode.discountAmount} (${input.appliedCode.code})`;
  } else if (input.appliedCode?.kind === "amount" && input.unitPrice != null) {
    const amountPriced = applyEventFixedAmountDiscount({
      unitPrice: input.unitPrice,
      seats,
      discountAmount: input.appliedCode.discountAmount,
      ticketCount: input.appliedCode.ticketCount,
      currency: input.currency,
    });
    finalTotal = amountPriced.total;
    fixedAmount = {
      covered: amountPriced.covered,
      extra: amountPriced.extra,
      newUnit: amountPriced.newUnit,
      discountAmount: input.appliedCode.discountAmount,
      unitPrice: input.unitPrice,
    };
  } else if (input.appliedCode?.kind === "percent") {
    finalTotal = applyEventCodeDiscount({
      amount: subtotal,
      percent: input.appliedCode.percent,
      currency: input.currency,
    });
    discountBadge = `-${input.appliedCode.percent}% (${input.appliedCode.code})`;
  } else if (input.familyDiscountClaimed) {
    finalTotal = applyEventFamilyDiscount({
      amount: subtotal,
      claimed: true,
      currency: input.currency,
    });
    discountBadge = "-10%";
  }

  return {
    unitPrice: input.unitPrice,
    seats,
    adultTickets,
    minorTickets: acceptedMinors,
    minorUnitPrice,
    subtotal,
    finalTotal,
    hasDiscount: fixedAmount != null || finalTotal < subtotal,
    discountBadge,
    fixedAmount,
  };
}
