"use client";

import type { Dispatch, ReactNode, SetStateAction } from "react";
import { EventRegisterAmountStep } from "@/components/organisms/EventRegisterAmountStep";
import { EventRegisterFormFooter } from "@/components/organisms/EventRegisterFormFooter";
import { EventRegisterMultiTicketSection } from "@/components/organisms/EventRegisterMultiTicketSection";
import { EventRegisterStep } from "@/components/organisms/EventRegisterStep";
import { EventRegisterWhoStep } from "@/components/organisms/EventRegisterWhoStep";
import type { EventRegistrationPaymentMethod } from "@/lib/events/resolveEventRegistrationPaymentMethods";
import type { PublicEventDetail } from "@/lib/dashboard/events/loadEventForPublicLanding";
import type { EventRegisterFormLabels } from "@/lib/events/eventRegisterFormLabels";
import type { PublicEventSurfaceVariant } from "@/lib/events/publicEventSurfaceVariant";
import { EventRegisterPaymentPicker } from "@/components/organisms/EventRegisterPaymentPicker";
import { EventRegisterTransferReceiptField } from "@/components/organisms/EventRegisterTransferReceiptField";
import { EventRegisterDualTransferSection } from "@/components/organisms/EventRegisterDualTransferSection";
import { EventRegisterTicketStep } from "@/components/organisms/EventRegisterTicketStep";
import { type EventRegistrationTotals } from "@/components/organisms/EventRegisterTotalSummaryCard";
import type { useEventRegisterForm } from "@/hooks/useEventRegisterForm";
import { type EventDiscountApplied } from "@/lib/events/resolveEventDiscountSelection";

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
  seatHold?: {
    locks: EventRegisterPurchaseFlowProps["event"]["seatLocks"];
    heldByOthers: string[];
    lostSeatKeys: string[];
    onBeforeSelect?: (seatKey: string) => Promise<boolean>;
    onSeatRefused?: (seatKey: string) => void;
  };
  seatNotice?: ReactNode;
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
  seatHold,
  seatNotice,
}: EventRegisterPurchaseFlowProps) {
  const hasTicketStep = Boolean(event.allowMultipleTickets && labels.companions) || showSeatPicker;
  const showPay =
    form.payment.showPaymentPicker ||
    form.payment.showTransferInstructions ||
    form.payment.requiresTransferReceipt;
  let step = 1;
  const seatsFirst = showSeatPicker && hasTicketStep;
  const earlyTicketStep = seatsFirst ? String(step++) : null;
  const whoStep = String(step++);
  const lateTicketStep = hasTicketStep && !seatsFirst ? String(step++) : null;
  const amountStep = String(step++);
  const lastStep = String(step++);
  const seats = event.allowMultipleTickets ? form.payment.ticketQuantity : 1;
  const ticketBlock = (stepNo: string, ticketPart: "all" | "quantity") => (
    <EventRegisterStep step={stepNo} title={labels.steps.tickets} lead={labels.steps.ticketsLead}>
      <EventRegisterTicketStep
        event={event}
        labels={labels}
        form={form}
        showSeatPicker={showSeatPicker}
        seats={seats}
        seatHold={seatHold}
        seatNotice={seatNotice}
        ticketPart={ticketPart}
      />
    </EventRegisterStep>
  );

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
      {earlyTicketStep ? ticketBlock(earlyTicketStep, "quantity") : null}

      <EventRegisterWhoStep
        step={whoStep}
        locale={locale}
        event={event}
        surfaceVariant={surfaceVariant}
        labels={labels}
        form={form}
      />

      {seatsFirst && event.companionRequireDetails && labels.companions ? (
        <EventRegisterMultiTicketSection
          ticketQuantity={form.payment.ticketQuantity}
          onTicketQuantityChange={form.payment.setTicketQuantity}
          requireCompanionDetails
          collectDni={Boolean(event.companionCollectDni)}
          collectEmail={Boolean(event.companionCollectEmail)}
          collectBirthDate={Boolean(event.companionCollectBirthDate)}
          companions={form.payment.companions}
          onCompanionChange={form.payment.updateCompanion}
          disabled={form.footer.isPending}
          labels={labels.companions}
          part="companions"
        />
      ) : null}

      {lateTicketStep ? ticketBlock(lateTicketStep, "all") : null}

      <EventRegisterAmountStep
        step={amountStep}
        locale={locale}
        event={event}
        surfaceVariant={surfaceVariant}
        labels={labels}
        form={form}
        totals={totals}
        seats={seats}
        familyDiscount={familyDiscount}
        setFamilyDiscount={setFamilyDiscount}
        appliedCode={appliedCode}
        setAppliedCode={setAppliedCode}
      />

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
          uploadPercent={form.footer.uploadPercent}
          message={form.footer.message}
          surfaceVariant={surfaceVariant}
          preview={preview}
        />
      </EventRegisterStep>
    </form>
  );
}
