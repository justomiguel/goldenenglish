"use client";

import { useEffect, useRef, useState } from "react";
import type { EventRegistrationPaymentMethod } from "@/lib/events/resolveEventRegistrationPaymentMethods";
import type { PublicEventDetail } from "@/lib/dashboard/events/loadEventForPublicLanding";
import type { EventRegisterFormLabels } from "@/lib/events/eventRegisterFormLabels";
import type { PublicEventSurfaceVariant } from "@/lib/events/publicEventSurfaceVariant";
import type { EventDiscountApplied } from "@/lib/events/resolveEventDiscountSelection";
import { EventRegisterPurchaseFlow } from "@/components/organisms/EventRegisterPurchaseFlow";
import { resolveEventRegistrationTotals } from "@/components/organisms/EventRegisterTotalSummaryCard";
import { EventRegisterSuccessDialog } from "@/components/molecules/EventRegisterSuccessDialog";
import { isEventSeatMapActive } from "@/lib/events/seatMapState";
import { useEventRegisterForm } from "@/hooks/useEventRegisterForm";
import { useEventSeatHold } from "@/hooks/useEventSeatHold";
import { seatLabelsForKeys } from "@/lib/events/suggestNearbyFreeSeats";
import { EventRegisterSeatHoldNotice } from "@/components/organisms/EventRegisterSeatHoldNotice";

function formatHoldClock(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function scrollToSeatMap() {
  document.getElementById("event-seat-map")?.scrollIntoView({ behavior: "smooth", block: "center" });
}

interface EventRegisterFormProps {
  locale: string;
  event: PublicEventDetail;
  paymentMethods: EventRegistrationPaymentMethod[];
  surfaceVariant?: PublicEventSurfaceVariant;
  labels: EventRegisterFormLabels;
  preview?: boolean;
  seatNoticePlacement?: "inline" | "sticky";
}

export function EventRegisterForm({
  locale,
  event,
  paymentMethods,
  surfaceVariant = "default",
  labels,
  preview = false,
  seatNoticePlacement = "inline",
}: EventRegisterFormProps) {
  const [familyDiscount, setFamilyDiscount] = useState(false);
  const [appliedCode, setAppliedCode] = useState<EventDiscountApplied | null>(null);
  const seatHoldTokenRef = useRef("");
  const onSeatConflictRef = useRef<(keys: string[]) => void>(() => {});
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
            seat_hold_required: labels.seatMap.holdFailed,
            hold_failed: labels.seatMap.holdFailed,
            claim_failed: labels.seatMap.holdFailed,
          }
        : {}),
      ...(labels.minorTickets ? { minor_count_invalid: labels.minorTickets.invalid, minors_not_allowed: labels.minorTickets.invalid, minor_price_missing: labels.minorTickets.invalid } : {}),
    },
    seatHoldTokenRef,
    onSeatConflictRef,
  });
  const showSeatPicker = isEventSeatMapActive(event.seatMapConfig) && Boolean(labels.seatMap);
  const seats = event.allowMultipleTickets ? form.payment.ticketQuantity : 1;
  const seatHold = useEventSeatHold({
    enabled: showSeatPicker && !preview,
    slug: event.slug,
    eventId: event.id,
    locale,
    config: event.seatMapConfig ?? null,
    requiredCount: seats,
    initialLocks: event.seatLocks ?? [],
    selectedSeatKeys: form.payment.selectedSeatKeys,
    onSelectedSeatKeysChange: form.payment.setSelectedSeatKeys,
  });
  useEffect(() => {
    seatHoldTokenRef.current = seatHold.token;
    onSeatConflictRef.current = seatHold.reportTaken;
  }, [seatHold.token, seatHold.reportTaken]);
  const lostLabels = event.seatMapConfig
    ? seatLabelsForKeys(event.seatMapConfig, seatHold.lostSeatKeys).join(", ")
    : "";
  const notice = seatHold.lostSeatKeys.length > 0 && labels.seatMap
    ? labels.seatMap.lostSeatsNotice.replace("{labels}", lostLabels)
    : null;
  const countdown = seatHold.expiresAt && labels.seatMap && form.payment.selectedSeatKeys.length > 0
    ? labels.seatMap.holdCountdown.replace("{time}", formatHoldClock(seatHold.expiresAt))
    : null;
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
        seatHold={{
          locks: seatHold.locks,
          heldByOthers: seatHold.heldByOthers,
          lostSeatKeys: seatHold.lostSeatKeys,
        }}
        seatNotice={
          seatNoticePlacement === "inline" && labels.seatMap ? (
            <EventRegisterSeatHoldNotice
              placement="inline"
              notice={notice}
              countdown={countdown}
              chooseAnotherLabel={labels.seatMap.chooseAnotherSeat}
              useSuggestedLabel={seatHold.suggestions.length > 0 ? labels.seatMap.useSuggestedSeats : null}
              onChooseAnother={scrollToSeatMap}
              onUseSuggestions={seatHold.useSuggestions}
            />
          ) : null
        }
      />
      {seatNoticePlacement === "sticky" && labels.seatMap ? (
        <EventRegisterSeatHoldNotice
          placement="sticky"
          notice={notice}
          countdown={countdown}
          chooseAnotherLabel={labels.seatMap.chooseAnotherSeat}
          useSuggestedLabel={seatHold.suggestions.length > 0 ? labels.seatMap.useSuggestedSeats : null}
          onChooseAnother={scrollToSeatMap}
          onUseSuggestions={seatHold.useSuggestions}
        />
      ) : null}
    </>
  );
}
