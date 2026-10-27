"use client";

import type { Dispatch, SetStateAction } from "react";
import { EventRegisterFamilyDiscount } from "@/components/organisms/EventRegisterFamilyDiscount";
import { EventRegisterDiscountCode } from "@/components/organisms/EventRegisterDiscountCode";
import { EventRegisterFormFooter } from "@/components/organisms/EventRegisterFormFooter";
import { EventRegisterStep } from "@/components/organisms/EventRegisterStep";
import { EventRegisterWhoStep } from "@/components/organisms/EventRegisterWhoStep";
import type { EventRegistrationPaymentMethod } from "@/lib/events/resolveEventRegistrationPaymentMethods";
import type { PublicEventDetail } from "@/lib/dashboard/events/loadEventForPublicLanding";
import type { EventRegisterFormLabels } from "@/lib/events/eventRegisterFormLabels";
import type { PublicEventSurfaceVariant } from "@/lib/events/publicEventSurfaceVariant";
import { EventRegisterPaymentPicker } from "@/components/organisms/EventRegisterPaymentPicker";
import { EventRegisterResidencyPicker } from "@/components/organisms/EventRegisterResidencyPicker";
import { EventRegisterTransferReceiptField } from "@/components/organisms/EventRegisterTransferReceiptField";
import { EventRegisterDualTransferSection } from "@/components/organisms/EventRegisterDualTransferSection";
import { EventRegisterSeatPicker } from "@/components/organisms/EventRegisterSeatPicker";
import { EventRegisterMultiTicketSection } from "@/components/organisms/EventRegisterMultiTicketSection";
import { EventRegisterMinorTicketsField } from "@/components/organisms/EventRegisterMinorTicketsField";
import {
  EventRegisterTotalSummaryCard,
  type EventRegistrationTotals,
} from "@/components/organisms/EventRegisterTotalSummaryCard";
import type { useEventRegisterForm } from "@/hooks/useEventRegisterForm";
import {
  clearEventDiscountCode,
  selectEventDiscountCode,
  selectEventFamilyDiscount,
  type EventDiscountApplied,
} from "@/lib/events/resolveEventDiscountSelection";

interface EventRegisterPurchaseFlowProps {
  locale: string;
  event: PublicEventDetail;
  paymentMethods: EventRegistrationPaymentMethod[];
  surfaceVariant: PublicEventSurfaceVariant;
  labels: EventRegisterFormLabels;
  preview: boolean;
  form: ReturnType<typeof useEventRegisterForm>;
  familyDiscount: boolean;
  setFamilyDiscount: Dispatch<SetStateAction<boolean>>;
  appliedCode: EventDiscountApplied | null;
  setAppliedCode: Dispatch<SetStateAction<EventDiscountApplied | null>>;
  showSeatPicker: boolean;
  totals: EventRegistrationTotals;
}

export function EventRegisterPurchaseFlow({
  locale,
  event,
  paymentMethods,
  surfaceVariant,
  labels,
  preview,
  form,
  familyDiscount,
  setFamilyDiscount,
  appliedCode,
  setAppliedCode,
  showSeatPicker,
  totals,
}: EventRegisterPurchaseFlowProps) {
  const hasTicketStep = Boolean(event.allowMultipleTickets && labels.companions) || showSeatPicker;
  const showPay =
    form.payment.showPaymentPicker ||
    form.payment.showTransferInstructions ||
    form.payment.requiresTransferReceipt;
  let step = 1;
  const whoStep = String(step++);
  const ticketStep = hasTicketStep ? String(step++) : null;
  const amountStep = String(step++);
  const lastStep = String(step++);
  const seats = event.allowMultipleTickets ? form.payment.ticketQuantity : 1;

  return (
    <form
      className="space-y-8"
      onSubmit={(eventForm) => {
        if (preview) {
          eventForm.preventDefault();
          return;
        }
        form.handleSubmit(eventForm);
      }}
    >
      <EventRegisterWhoStep
        step={whoStep}
        locale={locale}
        event={event}
        surfaceVariant={surfaceVariant}
        labels={labels}
        form={form}
      />

      {ticketStep ? (
        <EventRegisterStep step={ticketStep} title={labels.steps.tickets} lead={labels.steps.ticketsLead}>
          {event.allowMultipleTickets && labels.companions ? (
            <EventRegisterMultiTicketSection
              ticketQuantity={form.payment.ticketQuantity}
              onTicketQuantityChange={form.payment.setTicketQuantity}
              requireCompanionDetails={Boolean(event.companionRequireDetails)}
              collectDni={Boolean(event.companionCollectDni)}
              collectEmail={Boolean(event.companionCollectEmail)}
              collectBirthDate={Boolean(event.companionCollectBirthDate)}
              companions={form.payment.companions}
              onCompanionChange={form.payment.updateCompanion}
              disabled={form.footer.isPending}
              labels={labels.companions}
            />
          ) : null}
          {showSeatPicker && event.seatMapConfig && labels.seatMap ? (
            <EventRegisterSeatPicker
              config={event.seatMapConfig}
              locks={event.seatLocks ?? []}
              requiredSeatCount={seats}
              selectedSeatKeys={form.payment.selectedSeatKeys}
              onSelectedSeatKeysChange={form.payment.setSelectedSeatKeys}
              labels={labels.seatMap}
            />
          ) : null}
        </EventRegisterStep>
      ) : null}

      <EventRegisterStep step={amountStep} title={labels.steps.amount} lead={labels.steps.amountLead}>
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

      <EventRegisterStep
        step={lastStep}
        title={showPay ? labels.steps.pay : labels.steps.confirm}
        lead={showPay ? labels.steps.payLead : labels.steps.confirmLead}
      >
        {form.payment.showPaymentPicker ? (
          <EventRegisterPaymentPicker
            methods={paymentMethods}
            value={form.payment.paymentMethod}
            onChange={form.payment.setPaymentMethod}
            labels={labels.payment}
            surfaceVariant={surfaceVariant}
          />
        ) : null}
        {form.payment.showTransferInstructions ? (
          <EventRegisterDualTransferSection
            config={event.bankTransferSourcesConfig ?? null}
            bankTransferInstructions={event.bankTransferInstructions}
            globalTransferInstructions={event.globalBankTransferInstructions ?? null}
            globalFallbackLabel={labels.transferSource.globalAccount}
            selectedOptionId={form.payment.transferOptionId}
            selectedSourceKey={form.payment.transferSourceKey}
            onOptionChange={form.payment.setTransferOptionId}
            onSourceChange={form.payment.setTransferSourceKey}
            labels={labels.transferSource}
            instructionsTitle={labels.transferInstructions.title}
            surfaceVariant={surfaceVariant}
            disabled={form.footer.isPending}
          />
        ) : null}
        {form.payment.requiresTransferReceipt ? (
          <EventRegisterTransferReceiptField
            labels={labels.transferReceipt}
            file={form.payment.receiptFile}
            onFileChange={form.payment.setReceiptFile}
            onValidationError={form.payment.setReceiptFieldError}
            disabled={form.footer.isPending}
            surfaceVariant={surfaceVariant}
          />
        ) : null}
        <EventRegisterFormFooter
          consent={form.footer.consent}
          onConsentChange={form.footer.setConsent}
          consentLabel={labels.consent}
          captchaRequired={labels.captchaRequired}
          receiptFieldError={form.payment.receiptFieldError}
          submitLabel={labels.submit}
          isPending={form.footer.isPending}
          fileUploadProgressSending={labels.fileUploadProgressSending}
          message={form.footer.message}
          surfaceVariant={surfaceVariant}
          preview={preview}
        />
      </EventRegisterStep>
    </form>
  );
}
