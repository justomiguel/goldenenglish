"use client";

import { useState } from "react";
import type { EventRegistrationPaymentMethod } from "@/lib/events/resolveEventRegistrationPaymentMethods";
import type { PublicEventDetail } from "@/lib/dashboard/events/loadEventForPublicLanding";
import type { EventRegisterFormLabels } from "@/lib/events/eventRegisterFormLabels";
import type { PublicEventSurfaceVariant } from "@/lib/events/publicEventSurfaceVariant";
import { EventRegisterPurchaseFlow } from "@/components/organisms/EventRegisterPurchaseFlow";
import { resolveEventRegistrationTotals } from "@/components/organisms/EventRegisterTotalSummaryCard";
import { EventRegisterSuccessDialog } from "@/components/molecules/EventRegisterSuccessDialog";
import { isEventSeatMapActive } from "@/lib/events/seatMapState";
import { useEventRegisterForm } from "@/hooks/useEventRegisterForm";
import type { EventDiscountApplied } from "@/lib/events/resolveEventDiscountSelection";

interface EventRegisterFormProps {
  locale: string;
  event: PublicEventDetail;
  paymentMethods: EventRegistrationPaymentMethod[];
  surfaceVariant?: PublicEventSurfaceVariant;
  labels: EventRegisterFormLabels;
  preview?: boolean;
}

export function EventRegisterForm({
  locale,
  event,
  paymentMethods,
  surfaceVariant = "default",
  labels,
  preview = false,
}: EventRegisterFormProps) {
  const [familyDiscount, setFamilyDiscount] = useState(false);
  const [appliedCode, setAppliedCode] = useState<EventDiscountApplied | null>(null);
  const form = useEventRegisterForm({
    locale,
    event,
    paymentMethods,
    labels,
    familyDiscountClaimed: familyDiscount,
    discountCode: appliedCode?.code ?? null,
    appliedCode,
    discountErrors: {
      invalid_code: labels.discountCode.invalid,
      no_uses: labels.discountCode.noUses,
      discount_conflict: labels.discountCode.conflict,
      ...(labels.seatMap
        ? {
            seat_count_mismatch: labels.seatMap.seatCountMismatch,
            seat_already_taken: labels.seatMap.seatAlreadyTaken,
            invalid_seat: labels.seatMap.invalidSeat,
          }
        : {}),
      ...(labels.minorTickets ? { minor_count_invalid: labels.minorTickets.invalid, minors_not_allowed: labels.minorTickets.invalid, minor_price_missing: labels.minorTickets.invalid } : {}),
    },
  });
  const showSeatPicker = isEventSeatMapActive(event.seatMapConfig) && Boolean(labels.seatMap);
  const seats = event.allowMultipleTickets ? form.payment.ticketQuantity : 1;
  const totals = resolveEventRegistrationTotals({
    unitPrice: form.payment.unitPrice,
    seats,
    minorTickets: form.payment.minorTicketCount,
    minorUnitPrice: event.minorTicketPrice ?? null,
    currency: event.currency,
    familyDiscountClaimed: Boolean(event.allowFamilyDiscount && familyDiscount),
    appliedCode,
  });

  return (
    <>
      <EventRegisterSuccessDialog locale={locale} open={form.successOpen} labels={labels.successModal} />
      <EventRegisterPurchaseFlow
        locale={locale}
        event={event}
        paymentMethods={paymentMethods}
        surfaceVariant={surfaceVariant}
        labels={labels}
        preview={preview}
        form={form}
        familyDiscount={familyDiscount}
        setFamilyDiscount={setFamilyDiscount}
        appliedCode={appliedCode}
        setAppliedCode={setAppliedCode}
        showSeatPicker={showSeatPicker}
        totals={totals}
      />
    </>
  );
}
