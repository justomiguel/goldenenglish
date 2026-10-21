"use client";

import { useState } from "react";
import { EventRegisterOrderedQuestions } from "@/components/organisms/EventRegisterOrderedQuestions";
import { EventRegisterFamilyDiscount } from "@/components/organisms/EventRegisterFamilyDiscount";
import { EventRegisterDiscountCode } from "@/components/organisms/EventRegisterDiscountCode";
import { EventRegisterFlowChoice } from "@/components/organisms/EventRegisterFlowChoice";
import { EventRegisterFormFooter } from "@/components/organisms/EventRegisterFormFooter";
import type { EventRegistrationPaymentMethod } from "@/lib/events/resolveEventRegistrationPaymentMethods";
import type { PublicEventDetail } from "@/lib/dashboard/events/loadEventForPublicLanding";
import type { EventRegisterFormLabels } from "@/lib/events/eventRegisterFormLabels";
import type { PublicEventSurfaceVariant } from "@/lib/events/publicEventSurfaceVariant";
import { publicEventRegisterTypography } from "@/lib/events/publicEventSurfaceClasses";
import { EventRegisterTutorBlock } from "@/components/organisms/EventRegisterTutorBlock";
import { EventRegisterPaymentPicker } from "@/components/organisms/EventRegisterPaymentPicker";
import { EventRegisterResidencyPicker } from "@/components/organisms/EventRegisterResidencyPicker";
import { EventRegisterTransferReceiptField } from "@/components/organisms/EventRegisterTransferReceiptField";
import { EventRegisterBankTransferInstructions } from "@/components/organisms/EventRegisterBankTransferInstructions";
import { EventRegisterSuccessDialog } from "@/components/molecules/EventRegisterSuccessDialog";
import { formatEventFlowPriceLabel } from "@/lib/events/formatEventFlowPrice";
import { useEventRegisterForm } from "@/hooks/useEventRegisterForm";
import {
  clearEventDiscountCode,
  selectEventDiscountCode,
  selectEventFamilyDiscount,
  type EventDiscountApplied,
} from "@/lib/events/resolveEventDiscountSelection";

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
    payableAmount: appliedCode?.amount ?? null,
    discountErrors: {
      invalid_code: labels.discountCode.invalid,
      no_uses: labels.discountCode.noUses,
      discount_conflict: labels.discountCode.conflict,
    },
  });
  const typography = publicEventRegisterTypography(surfaceVariant);

  return (
    <>
      <EventRegisterSuccessDialog
        locale={locale}
        open={form.successOpen}
        labels={labels.successModal}
      />
      <form
        className="space-y-6"
        onSubmit={(eventForm) => {
          if (preview) {
            eventForm.preventDefault();
            return;
          }
          form.handleSubmit(eventForm);
        }}
      >
        {form.flow.ask ? (
          <EventRegisterFlowChoice
            label={labels.flowQuestion}
            flows={form.flow.options}
            value={form.flow.flowId}
            onChange={form.flow.onChange}
            disabled={form.footer.isPending}
            showPrices={event.priceByFlow}
            currency={event.currency}
            locale={locale}
            freeLabel={labels.free}
          />
        ) : event.priceByFlow && event.flows.length === 1 ? (
          <p className="text-base font-semibold tabular-nums text-[var(--color-primary)]">
            {formatEventFlowPriceLabel({
              price: event.flows[0]?.price ?? null,
              currency: event.currency,
              locale,
              freeLabel: labels.free,
            })}
          </p>
        ) : null}
        <EventRegisterOrderedQuestions
          sectionTitle={labels.participantSection}
          surfaceVariant={surfaceVariant}
          questionOrder={form.flow.questionOrder}
          collectBirthDate={event.collectBirthDate}
          requirePhone={Boolean(event.requirePhone)}
          requireBirthDate={Boolean(event.requireBirthDate)}
          fields={event.fields}
          locale={locale}
          defaultLocale={event.defaultLocale}
          labels={{
            firstName: labels.firstName,
            lastName: labels.lastName,
            dni: labels.dni,
            email: labels.email,
            phone: labels.phone,
            birthDate: labels.birthDate,
          }}
          values={form.participant.values}
          onChange={form.participant.onChange}
          customValues={form.customFields.values}
          fieldFiles={form.customFields.files}
          onCustomChange={form.customFields.onChange}
          onFileChange={form.customFields.onFileChange}
          onFileValidationError={form.customFields.onFileValidationError}
          fileFieldErrors={form.customFields.fileErrors}
          uploadingFieldId={form.customFields.uploadingFieldId}
          selectPlaceholder={labels.selectPlaceholder}
          customFileFieldLabels={labels.customFieldFile}
          disabled={form.footer.isPending}
        />

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

        <EventRegisterFamilyDiscount
          baseAmount={form.selectedPrice}
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

        <EventRegisterDiscountCode
          slug={event.slug}
          locale={locale}
          currency={event.currency}
          freeLabel={labels.free}
          flowId={form.flow.flowId}
          isLocalResident={form.residency.isLocalResident}
          disabled={form.footer.isPending}
          applied={appliedCode}
          onApplied={(next) => {
            const selection = selectEventDiscountCode(next);
            setFamilyDiscount(selection.family);
            setAppliedCode(selection.applied);
          }}
          onClear={() => setAppliedCode(clearEventDiscountCode(familyDiscount).applied)}
          labels={labels.discountCode}
        />

        {form.payment.showPaymentPicker ? (
          <EventRegisterPaymentPicker
            methods={paymentMethods}
            value={form.payment.paymentMethod}
            onChange={form.payment.setPaymentMethod}
            labels={labels.payment}
            surfaceVariant={surfaceVariant}
          />
        ) : null}

        {form.payment.showTransferInstructions && event.bankTransferInstructions ? (
          <EventRegisterBankTransferInstructions
            title={labels.transferInstructions.title}
            instructions={event.bankTransferInstructions}
            surfaceVariant={surfaceVariant}
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

        {form.selectedPrice != null && form.selectedPrice > 0 ? (
          <p className={typography.price}>
            {event.currency} {form.selectedPrice.toFixed(2)}
          </p>
        ) : null}

        {form.tutor.isMinor ? (
          <EventRegisterTutorBlock
            values={form.tutor.values}
            onChange={form.tutor.onChange}
            labels={labels.tutor}
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
      </form>
    </>
  );
}
