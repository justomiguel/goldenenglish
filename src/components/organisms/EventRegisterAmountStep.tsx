"use client";

import type { Dispatch, SetStateAction } from "react";
import { EventRegisterDiscountCode } from "@/components/organisms/EventRegisterDiscountCode";
import { EventRegisterFamilyDiscount } from "@/components/organisms/EventRegisterFamilyDiscount";
import { EventRegisterMinorTicketsField } from "@/components/organisms/EventRegisterMinorTicketsField";
import { EventRegisterResidencyPicker } from "@/components/organisms/EventRegisterResidencyPicker";
import { EventRegisterStep } from "@/components/organisms/EventRegisterStep";
import {
  EventRegisterTotalSummaryCard,
  type EventRegistrationTotals,
} from "@/components/organisms/EventRegisterTotalSummaryCard";
import type { PublicEventDetail } from "@/lib/dashboard/events/loadEventForPublicLanding";
import type { EventRegisterFormLabels } from "@/lib/events/eventRegisterFormLabels";
import type { PublicEventSurfaceVariant } from "@/lib/events/publicEventSurfaceVariant";
import type { useEventRegisterForm } from "@/hooks/useEventRegisterForm";
import {
  clearEventDiscountCode,
  selectEventDiscountCode,
  selectEventFamilyDiscount,
  type EventDiscountApplied,
} from "@/lib/events/resolveEventDiscountSelection";

interface EventRegisterAmountStepProps {
  step: string;
  locale: string;
  event: PublicEventDetail;
  surfaceVariant: PublicEventSurfaceVariant;
  labels: EventRegisterFormLabels;
  form: ReturnType<typeof useEventRegisterForm>;
  totals: EventRegistrationTotals;
  seats: number;
  familyDiscount: boolean;
  setFamilyDiscount: Dispatch<SetStateAction<boolean>>;
  appliedCode: EventDiscountApplied | null;
  setAppliedCode: Dispatch<SetStateAction<EventDiscountApplied | null>>;
}

export function EventRegisterAmountStep({
  step,
  locale,
  event,
  surfaceVariant,
  labels,
  form,
  totals,
  seats,
  familyDiscount,
  setFamilyDiscount,
  appliedCode,
  setAppliedCode,
}: EventRegisterAmountStepProps) {
  return (
    <EventRegisterStep step={step} title={labels.steps.amount} lead={labels.steps.amountLead}>
      {event.hasTieredPricing && !event.priceByFlow ? (
        <EventRegisterResidencyPicker
          value={form.residency.isLocalResident}
          onChange={form.residency.setIsLocalResident}
          labels={labels.residency}
          currency={event.currency}
          priceLocal={event.priceLocal}
          priceNonLocal={event.priceNonLocal}
          surfaceVariant={surfaceVariant}
        />
      ) : null}
      {event.allowFamilyDiscount ? (
        <EventRegisterFamilyDiscount
          baseAmount={totals.subtotal}
          currency={event.currency}
          locale={locale}
          freeLabel={labels.free}
          checked={familyDiscount}
          onChange={(checked) => {
            const next = selectEventFamilyDiscount(checked, appliedCode);
            setFamilyDiscount(next.family);
            setAppliedCode(next.applied);
          }}
          label={labels.familyDiscount}
          payLabel={labels.familyDiscountPay}
        />
      ) : null}
      <EventRegisterDiscountCode
        slug={event.slug}
        locale={locale}
        currency={event.currency}
        freeLabel={labels.free}
        flowId={form.flow.flowId}
        isLocalResident={form.residency.isLocalResident}
        disabled={form.footer.isPending}
        applied={appliedCode}
        payAmount={appliedCode?.kind === "percent" ? totals.finalTotal : null}
        onApplied={(next) => {
          const selection = selectEventDiscountCode(next);
          setFamilyDiscount(selection.family);
          setAppliedCode(selection.applied);
        }}
        onClear={() => setAppliedCode(clearEventDiscountCode(familyDiscount).applied)}
        labels={labels.discountCode}
      />
      {event.allowMinorTickets && labels.minorTickets ? (
        <EventRegisterMinorTicketsField
          seats={seats}
          count={form.payment.minorTicketCount}
          disabled={form.footer.isPending}
          labels={labels.minorTickets}
          onChange={form.payment.setMinorTicketCount}
        />
      ) : null}
      <EventRegisterTotalSummaryCard
        totals={totals}
        currency={event.currency}
        locale={locale}
        freeLabel={labels.free}
        totalLabel={labels.companions?.totalLabel ?? labels.steps.amount}
        totalHintTemplate={labels.companions?.totalHint}
        minorLines={labels.minorTickets}
        fixedAmountLabels={labels.discountCode}
      />
    </EventRegisterStep>
  );
}
