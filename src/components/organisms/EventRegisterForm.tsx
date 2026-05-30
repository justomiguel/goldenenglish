"use client";

import { useMemo, useState } from "react";
import { EventRegisterParticipantFields } from "@/components/organisms/EventRegisterParticipantFields";
import { EventRegisterFormFooter } from "@/components/organisms/EventRegisterFormFooter";
import { resolveAttendeeIsMinor } from "@/lib/events/resolveAttendeeIsMinor";
import {
  eventRequiresPayment,
  resolveEventPriceForResidency,
} from "@/lib/events/resolveEventPriceTier";
import type { EventRegistrationPaymentMethod } from "@/lib/events/resolveEventRegistrationPaymentMethods";
import type { PublicEventDetail } from "@/lib/dashboard/events/loadEventForPublicLanding";
import type { EventRegisterFormLabels } from "@/lib/events/eventRegisterFormLabels";
import { EventRegisterFormFields } from "@/components/organisms/EventRegisterFormFields";
import { EventRegisterTutorBlock } from "@/components/organisms/EventRegisterTutorBlock";
import { EventRegisterPaymentPicker } from "@/components/organisms/EventRegisterPaymentPicker";
import { EventRegisterResidencyPicker } from "@/components/organisms/EventRegisterResidencyPicker";
import { EventRegisterTransferReceiptField } from "@/components/organisms/EventRegisterTransferReceiptField";
import { EventRegisterBankTransferInstructions } from "@/components/organisms/EventRegisterBankTransferInstructions";
import { EventRegisterSuccessDialog } from "@/components/molecules/EventRegisterSuccessDialog";
import { useEventRegisterSubmit } from "@/hooks/useEventRegisterSubmit";

interface EventRegisterFormProps {
  locale: string;
  event: PublicEventDetail;
  paymentMethods: EventRegistrationPaymentMethod[];
  labels: EventRegisterFormLabels;
}

export function EventRegisterForm({
  locale,
  event,
  paymentMethods,
  labels,
}: EventRegisterFormProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dni, setDni] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [consent, setConsent] = useState(false);
  const [isLocalResident, setIsLocalResident] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<EventRegistrationPaymentMethod>(
    () => paymentMethods[0] ?? "flow",
  );
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptFieldError, setReceiptFieldError] = useState("");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [tutor, setTutor] = useState({
    tutorFirstName: "",
    tutorLastName: "",
    tutorDniOrPassport: "",
    tutorEmail: "",
    tutorPhone: "",
    tutorRelationship: "",
  });

  const { submit, message, isPending, successOpen } = useEventRegisterSubmit({
    labels: {
      error: labels.error,
      transferReceiptRequired: labels.transferReceipt.required,
      transferReceiptUploadFailed: labels.transferReceipt.uploadFailed,
    },
  });

  const isMinor = useMemo(
    () => resolveAttendeeIsMinor(birthDate, 18),
    [birthDate],
  );

  const priceSource = useMemo(
    () => ({
      price: event.price,
      priceLocal: event.priceLocal,
      priceNonLocal: event.priceNonLocal,
    }),
    [event.price, event.priceLocal, event.priceNonLocal],
  );

  const selectedPrice = useMemo(
    () => resolveEventPriceForResidency(priceSource, isLocalResident),
    [priceSource, isLocalResident],
  );

  const requiresPayment = eventRequiresPayment(priceSource, isLocalResident);
  const showPaymentPicker = requiresPayment && paymentMethods.length > 0;
  const requiresTransferReceipt =
    showPaymentPicker &&
    paymentMethod === "transfer" &&
    paymentMethods.includes("transfer");
  const showTransferInstructions =
    showPaymentPicker &&
    paymentMethod === "transfer" &&
    Boolean(event.bankTransferInstructions?.trim());

  function handleSubmit(eventForm: React.FormEvent<HTMLFormElement>) {
    eventForm.preventDefault();
    if (!consent) return;
    void submit({
      locale,
      slug: event.slug,
      firstName,
      lastName,
      dni,
      email,
      phone,
      birthDate,
      isMinor,
      tutor,
      fieldValues,
      isLocalResident: event.hasTieredPricing ? isLocalResident : true,
      paymentMethod,
      showPaymentPicker,
      requiresTransferReceipt,
      receiptFile,
    });
  }

  return (
    <>
    <EventRegisterSuccessDialog
      locale={locale}
      open={successOpen}
      labels={labels.successModal}
    />
    <form className="space-y-6" onSubmit={handleSubmit}>
      <EventRegisterParticipantFields
        sectionTitle={labels.participantSection}
        labels={{
          firstName: labels.firstName,
          lastName: labels.lastName,
          dni: labels.dni,
          email: labels.email,
          phone: labels.phone,
          birthDate: labels.birthDate,
        }}
        values={{ firstName, lastName, dni, email, phone, birthDate }}
        onChange={{
          firstName: setFirstName,
          lastName: setLastName,
          dni: setDni,
          email: setEmail,
          phone: setPhone,
          birthDate: setBirthDate,
        }}
      />

      <EventRegisterFormFields
        fields={event.fields}
        locale={locale}
        defaultLocale={event.defaultLocale}
        values={fieldValues}
        onChange={(fieldId, value) => setFieldValues((current) => ({ ...current, [fieldId]: value }))}
        selectPlaceholder={labels.selectPlaceholder}
      />

      {event.hasTieredPricing ? (
        <EventRegisterResidencyPicker
          value={isLocalResident}
          onChange={setIsLocalResident}
          labels={labels.residency}
          currency={event.currency}
          priceLocal={event.priceLocal}
          priceNonLocal={event.priceNonLocal}
        />
      ) : null}

      {showPaymentPicker ? (
        <EventRegisterPaymentPicker
          methods={paymentMethods}
          value={paymentMethod}
          onChange={setPaymentMethod}
          labels={labels.payment}
        />
      ) : null}

      {showTransferInstructions && event.bankTransferInstructions ? (
        <EventRegisterBankTransferInstructions
          title={labels.transferInstructions.title}
          instructions={event.bankTransferInstructions}
        />
      ) : null}

      {requiresTransferReceipt ? (
        <EventRegisterTransferReceiptField
          labels={labels.transferReceipt}
          file={receiptFile}
          onFileChange={setReceiptFile}
          onValidationError={setReceiptFieldError}
          disabled={isPending}
        />
      ) : null}

      {selectedPrice != null && selectedPrice > 0 ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {event.currency} {selectedPrice.toFixed(2)}
        </p>
      ) : null}

      {isMinor ? (
        <EventRegisterTutorBlock
          values={tutor}
          onChange={(key, value) => setTutor((current) => ({ ...current, [key]: value }))}
          labels={labels.tutor}
        />
      ) : null}

      <EventRegisterFormFooter
        consent={consent}
        onConsentChange={setConsent}
        consentLabel={labels.consent}
        captchaRequired={labels.captchaRequired}
        receiptFieldError={receiptFieldError}
        submitLabel={labels.submit}
        isPending={isPending}
        fileUploadProgressSending={labels.fileUploadProgressSending}
        message={message}
      />
    </form>
    </>
  );
}
