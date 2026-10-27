"use client";

import { useMemo, useState } from "react";
import { resolveAttendeeIsMinor } from "@/lib/events/resolveAttendeeIsMinor";
import { resolveRegistrationFlowView } from "@/lib/events/registrationFlows";
import type { EventRegistrationPaymentMethod } from "@/lib/events/resolveEventRegistrationPaymentMethods";
import { useEventRegisterPayment } from "@/hooks/useEventRegisterPayment";
import type { PublicEventDetail } from "@/lib/dashboard/events/loadEventForPublicLanding";
import type { EventRegisterFormLabels } from "@/lib/events/eventRegisterFormLabels";
import { useEventRegisterSubmit } from "@/hooks/useEventRegisterSubmit";
import type { EventDiscountApplied } from "@/lib/events/resolveEventDiscountSelection";

interface UseEventRegisterFormInput {
  locale: string;
  event: PublicEventDetail;
  paymentMethods: EventRegistrationPaymentMethod[];
  labels: EventRegisterFormLabels;
  familyDiscountClaimed: boolean;
  discountCode?: string | null;
  appliedCode?: EventDiscountApplied | null;
  payableAmount?: number | null;
  discountErrors?: { invalid_code: string; no_uses: string; discount_conflict: string };
}

export function useEventRegisterForm({
  locale,
  event,
  paymentMethods,
  labels,
  familyDiscountClaimed,
  discountCode = null,
  appliedCode = null,
  payableAmount = null,
  discountErrors,
}: UseEventRegisterFormInput) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dni, setDni] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [consent, setConsent] = useState(false);
  const [isLocalResident, setIsLocalResident] = useState(true);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [fieldFiles, setFieldFiles] = useState<Record<string, File | null>>({});
  const [fieldFileErrors, setFieldFileErrors] = useState<Record<string, string>>({});
  const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null);
  const [tutor, setTutor] = useState({
    tutorFirstName: "",
    tutorLastName: "",
    tutorDniOrPassport: "",
    tutorEmail: "",
    tutorPhone: "",
    tutorRelationship: "",
  });

  const { submit, message, isPending, successOpen, uploadingFieldId } = useEventRegisterSubmit({
    labels: {
      error: labels.error,
      transferReceiptRequired: labels.transferReceipt.required,
      transferReceiptUploadFailed: labels.transferReceipt.uploadFailed,
      paymentStartFailed: labels.payment.startFailed,
      customFieldFileRequired: labels.customFieldFile.required,
      customFieldFileTooLarge: labels.customFieldFile.tooLarge,
      customFieldFileInvalidType: labels.customFieldFile.invalidType,
      customFieldFileUploadFailed: labels.customFieldFile.uploadFailed,
    },
  });

  const isMinor = useMemo(
    () => (event.collectBirthDate ? resolveAttendeeIsMinor(birthDate, 18) : false),
    [birthDate, event.collectBirthDate],
  );

  const priceSource = useMemo(
    () => ({
      price: event.price,
      priceLocal: event.priceLocal,
      priceNonLocal: event.priceNonLocal,
    }),
    [event.price, event.priceLocal, event.priceNonLocal],
  );

  const flowView = useMemo(() => {
    if (!event.flows?.length) return null;
    return resolveRegistrationFlowView({
      flows: event.flows.map((flow, index) => ({
        id: flow.id,
        position: index,
        price: flow.price,
        fieldOrder: flow.fieldOrder,
      })),
      extras: event.fields.map((field, index) => ({
        id: field.id,
        position: field.position ?? index,
        flowId: field.flowId ?? null,
      })),
      sharedOrder: event.questionOrder,
      selectedFlowId,
      collectBirthDate: event.collectBirthDate,
    });
  }, [event, selectedFlowId]);

  const chosenFlow = event.flows?.find((flow) => flow.id === flowView?.flowId) ?? null;
  const payment = useEventRegisterPayment({
    paymentMethods,
    priceByFlow: event.priceByFlow,
    flowPrice: chosenFlow?.price ?? null,
    priceSource,
    isLocalResident,
    payableAmount,
    appliedCode,
    familyDiscountClaimed,
    currency: event.currency,
    allowMultipleTickets: event.allowMultipleTickets,
    allowMinorTickets: Boolean(event.allowMinorTickets),
    minorTicketPrice: event.minorTicketPrice ?? null,
    bankTransferInstructions: event.bankTransferInstructions,
    globalTransferInstructions: event.globalBankTransferInstructions ?? null,
    bankTransferSourcesConfig: event.bankTransferSourcesConfig ?? null,
  });

  function handleSubmit(eventForm: React.FormEvent<HTMLFormElement>) {
    eventForm.preventDefault();
    if (!consent) return;
    const extraSeats = event.allowMultipleTickets ? Math.max(0, payment.ticketQuantity - 1) : 0;
    const resolvedCompanions = Array.from({ length: extraSeats }, (_, idx) =>
      event.companionRequireDetails
        ? {
            firstName: payment.companions[idx]?.firstName ?? "",
            lastName: payment.companions[idx]?.lastName ?? "",
            dniOrPassport: payment.companions[idx]?.dniOrPassport,
            email: payment.companions[idx]?.email,
            birthDate: payment.companions[idx]?.birthDate,
          }
        : {
            firstName: firstName.trim() || "Titular",
            lastName: `${lastName.trim()} (#${idx + 2})`.trim(),
          },
    );

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
      fields: event.fields,
      fieldValues,
      fieldFiles,
      isLocalResident: event.hasTieredPricing ? isLocalResident : true,
      paymentMethod: payment.paymentMethod,
      allowedPaymentMethods: paymentMethods,
      showPaymentPicker: payment.showPaymentPicker,
      requiresTransferReceipt: payment.requiresTransferReceipt,
      receiptFile: payment.receiptFile,
      transferOptionId: payment.transferOptionId,
      transferSourceKey: payment.transferSourceKey,
      seatKeys: payment.selectedSeatKeys,
      companions: resolvedCompanions,
      minorTicketCount: payment.minorTicketCount,
      transferOptionRequired: labels.transferSource.optionRequired,
      transferSourceRequired: labels.transferSource.sourceRequired,
      flowId: flowView?.flowId ?? null,
      familyDiscountClaimed,
      discountCode,
      discountErrors,
    });
  }

  function selectFlow(flowId: string) {
    const next = resolveRegistrationFlowView({
      flows: (event.flows ?? []).map((flow, index) => ({
        id: flow.id, position: index, price: flow.price, fieldOrder: flow.fieldOrder,
      })),
      extras: event.fields.map((field, index) => ({
        id: field.id, position: field.position ?? index, flowId: field.flowId ?? null,
      })),
      sharedOrder: event.questionOrder,
      selectedFlowId: flowId,
      collectBirthDate: event.collectBirthDate,
    });
    const visible = new Set(
      next.questionOrder.filter((token) => token.startsWith("field:")).map((token) => token.slice(6)),
    );
    setSelectedFlowId(flowId);
    setFieldValues((current) => Object.fromEntries(Object.entries(current).filter(([id]) => visible.has(id))));
    setFieldFiles((current) => Object.fromEntries(Object.entries(current).filter(([id]) => visible.has(id))));
  }

  function handleFieldFileChange(fieldId: string, file: File | null) {
    setFieldFiles((current) => ({ ...current, [fieldId]: file }));
    if (file) {
      setFieldFileErrors((current) => {
        const next = { ...current };
        delete next[fieldId];
        return next;
      });
    }
  }

  return {
    participant: {
      values: { firstName, lastName, dni, email, phone, birthDate },
      onChange: { firstName: setFirstName, lastName: setLastName, dni: setDni, email: setEmail, phone: setPhone, birthDate: setBirthDate },
    },
    customFields: {
      values: fieldValues,
      files: fieldFiles,
      fileErrors: fieldFileErrors,
      onChange: (fieldId: string, value: string) =>
        setFieldValues((current) => ({ ...current, [fieldId]: value })),
      onFileChange: handleFieldFileChange,
      onFileValidationError: (fieldId: string, errorMessage: string) =>
        setFieldFileErrors((current) => ({ ...current, [fieldId]: errorMessage })),
      uploadingFieldId,
    },
    residency: { isLocalResident, setIsLocalResident },
    payment,
    tutor: {
      values: tutor,
      onChange: (key: keyof typeof tutor, value: string) =>
        setTutor((current) => ({ ...current, [key]: value })),
      isMinor,
    },
    footer: { consent, setConsent, message, isPending },
    flow: {
      ask: Boolean(flowView?.askFlow),
      options: (event.flows ?? []).map((flow) => ({ id: flow.id, name: flow.name, price: flow.price })),
      flowId: flowView?.flowId ?? null,
      questionOrder: flowView?.questionOrder ?? event.questionOrder,
      onChange: selectFlow,
    },
    selectedPrice: payment.selectedPrice,
    successOpen,
    handleSubmit,
  };
}
