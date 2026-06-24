"use client";

import { EventRegisterParticipantFields } from "@/components/organisms/EventRegisterParticipantFields";
import { EventRegisterFormFooter } from "@/components/organisms/EventRegisterFormFooter";
import type { EventRegistrationPaymentMethod } from "@/lib/events/resolveEventRegistrationPaymentMethods";
import type { PublicEventDetail } from "@/lib/dashboard/events/loadEventForPublicLanding";
import type { EventRegisterFormLabels } from "@/lib/events/eventRegisterFormLabels";
import type { PublicEventSurfaceVariant } from "@/lib/events/publicEventSurfaceVariant";
import { publicEventRegisterTypography } from "@/lib/events/publicEventSurfaceClasses";
import { EventRegisterFormFields } from "@/components/organisms/EventRegisterFormFields";
import { EventRegisterTutorBlock } from "@/components/organisms/EventRegisterTutorBlock";
import { EventRegisterPaymentPicker } from "@/components/organisms/EventRegisterPaymentPicker";
import { EventRegisterResidencyPicker } from "@/components/organisms/EventRegisterResidencyPicker";
import { EventRegisterTransferReceiptField } from "@/components/organisms/EventRegisterTransferReceiptField";
import { EventRegisterBankTransferInstructions } from "@/components/organisms/EventRegisterBankTransferInstructions";
import { EventRegisterSuccessDialog } from "@/components/molecules/EventRegisterSuccessDialog";
import { useEventRegisterForm } from "@/hooks/useEventRegisterForm";

interface EventRegisterFormProps {
  locale: string;
  event: PublicEventDetail;
  paymentMethods: EventRegistrationPaymentMethod[];
  surfaceVariant?: PublicEventSurfaceVariant;
  labels: EventRegisterFormLabels;
}

export function EventRegisterForm({
  locale,
  event,
  paymentMethods,
  surfaceVariant = "default",
  labels,
}: EventRegisterFormProps) {
  const form = useEventRegisterForm({ locale, event, paymentMethods, labels });
  const typography = publicEventRegisterTypography(surfaceVariant);

  return (
    <>
      <EventRegisterSuccessDialog
        locale={locale}
        open={form.successOpen}
        labels={labels.successModal}
      />
      <form className="space-y-6" onSubmit={form.handleSubmit}>
        <EventRegisterParticipantFields
          sectionTitle={labels.participantSection}
          surfaceVariant={surfaceVariant}
          showBirthDate={event.collectBirthDate}
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
        />

        <EventRegisterFormFields
          fields={event.fields}
          locale={locale}
          defaultLocale={event.defaultLocale}
          values={form.customFields.values}
          fieldFiles={form.customFields.files}
          onChange={form.customFields.onChange}
          onFileChange={form.customFields.onFileChange}
          onFileValidationError={form.customFields.onFileValidationError}
          fileFieldErrors={form.customFields.fileErrors}
          uploadingFieldId={form.customFields.uploadingFieldId}
          selectPlaceholder={labels.selectPlaceholder}
          customFileFieldLabels={labels.customFieldFile}
          disabled={form.footer.isPending}
          surfaceVariant={surfaceVariant}
        />

        {event.hasTieredPricing ? (
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
        />
      </form>
    </>
  );
}
