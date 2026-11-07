"use client";

import { useState } from "react";
import type { EventRegistrationPaymentMethod } from "@/lib/events/resolveEventRegistrationPaymentMethods";
import type { EventCompanionPayload, EventFormFieldDefinition } from "@/lib/events/types";
import { validateEventTransferReceiptFile } from "@/lib/events/eventTransferReceiptLimits";
import {
  fillEventFormFieldMaxMbTemplate,
  validateEventFormFieldFile,
} from "@/lib/events/validateEventFormFieldFile";
import { collectEventRegisterUploads } from "@/lib/client/collectEventRegisterUploads";
import { startEventGatewayPayment } from "@/lib/client/startEventGatewayPayment";
import { buildEventEnrollRequestBody } from "@/lib/events/buildEventEnrollRequestBody";
import {
  explainEventEnrollOutcome,
  type EventRegisterErrorCopy,
} from "@/lib/events/eventRegisterFailureMessage";

function isOnlineGatewayMethod(method: EventRegistrationPaymentMethod): method is "mercadopago" | "flow" {
  return method === "mercadopago" || method === "flow";
}

function isFileFieldType(fieldType: EventFormFieldDefinition["fieldType"]): boolean {
  return fieldType === "file" || fieldType === "image";
}

export interface EventRegisterSubmitPayload {
  locale: string;
  slug: string;
  firstName: string;
  lastName: string;
  dni: string;
  email: string;
  phone: string;
  birthDate: string;
  isMinor: boolean;
  tutor: {
    tutorFirstName: string;
    tutorLastName: string;
    tutorDniOrPassport: string;
    tutorEmail: string;
    tutorPhone: string;
    tutorRelationship: string;
  };
  fields: EventFormFieldDefinition[];
  fieldValues: Record<string, string>;
  fieldFiles: Record<string, File | null>;
  isLocalResident: boolean;
  paymentMethod: EventRegistrationPaymentMethod;
  allowedPaymentMethods: EventRegistrationPaymentMethod[];
  showPaymentPicker: boolean;
  requiresTransferReceipt: boolean;
  receiptFile: File | null;
  flowId?: string | null;
  familyDiscountClaimed: boolean;
  discountCode?: string | null;
  discountErrors?: Record<string, string>;
  transferOptionId?: string | null;
  transferSourceKey?: string | null;
  seatKeys?: string[];
  seatHoldToken?: string | null;
  onSeatConflict?: (keys: string[]) => void;
  companions?: EventCompanionPayload[];
  minorTicketCount?: number;
  transferOptionRequired?: string;
  transferSourceRequired?: string;
}

export interface EventRegisterSubmitLabels {
  error: string;
  transferReceiptRequired: string;
  transferReceiptUploadFailed: string;
  receiptAttachFailed: string;
  paymentStartFailed: string;
  customFieldFileRequired: string;
  customFieldFileTooLarge: string;
  customFieldFileInvalidType: string;
  customFieldFileUploadFailed: string;
  errors?: Partial<EventRegisterErrorCopy>;
}

interface UseEventRegisterSubmitArgs {
  labels: EventRegisterSubmitLabels;
}

export function useEventRegisterSubmit({ labels }: UseEventRegisterSubmitArgs) {
  const [message, setMessage] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [uploadingFieldId, setUploadingFieldId] = useState<string | null>(null);
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);

  async function submit(payload: EventRegisterSubmitPayload) {
    setIsPending(true);
    setMessage("");
    setUploadingFieldId(null);
    setUploadPercent(null);

    if (payload.requiresTransferReceipt) {
      const fileCheck = validateEventTransferReceiptFile(payload.receiptFile);
      if (!fileCheck.ok) {
        setMessage(labels.transferReceiptRequired);
        setIsPending(false);
        return;
      }
    }

    const fileFields = payload.fields.filter((field) => isFileFieldType(field.fieldType));
    for (const field of fileFields) {
      const file = payload.fieldFiles[field.id] ?? null;
      if (field.required && !file) {
        setMessage(labels.customFieldFileRequired);
        setIsPending(false);
        return;
      }
      if (!file) continue;
      const validated = validateEventFormFieldFile(field, file);
      if (!validated.ok) {
        if (validated.code === "too_large") {
          setMessage(fillEventFormFieldMaxMbTemplate(labels.customFieldFileTooLarge, field));
        } else if (validated.code === "invalid_type") {
          setMessage(labels.customFieldFileInvalidType);
        } else {
          setMessage(labels.customFieldFileRequired);
        }
        setIsPending(false);
        return;
      }
    }

    try {
      const uploaded = await collectEventRegisterUploads({
        slug: payload.slug,
        locale: payload.locale,
        email: payload.email,
        dniOrPassport: payload.dni,
        fields: payload.fields,
        fieldValues: payload.fieldValues,
        fieldFiles: payload.fieldFiles,
        receiptFile: payload.receiptFile,
        requiresReceipt: payload.requiresTransferReceipt,
        onProgress: setUploadPercent,
        onField: setUploadingFieldId,
      });
      if (!uploaded.ok) {
        setMessage(
          uploaded.code === "receipt_upload_failed"
            ? labels.transferReceiptUploadFailed
            : labels.customFieldFileUploadFailed,
        );
        return;
      }
      setUploadPercent(null);

      const response = await fetch(`/api/events/${payload.slug}/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          buildEventEnrollRequestBody({
            ...payload,
            fieldValues: uploaded.fieldValues,
            receiptStagingPath: uploaded.receiptPath,
          }),
        ),
      });

      const body = (await response.json().catch(() => null)) as {
        ok?: boolean;
        code?: string;
        seats?: number | null;
        result?: {
          attendeeId?: string | null;
          paymentRequired?: boolean;
          resultCode?: string;
          seats?: number | null;
          takenSeatKeys?: string[];
        };
      } | null;
      const outcome = explainEventEnrollOutcome({
        httpOk: response.ok,
        bodyOk: Boolean(body?.ok),
        status: response.status,
        code: body?.code,
        resultCode: body?.result?.resultCode,
        seats: body?.result?.seats ?? body?.seats,
        generic: labels.error,
        errors: labels.errors,
        fields: payload.fields,
        locale: payload.locale,
        overrides: {
          ...payload.discountErrors,
          ...(payload.transferOptionRequired
            ? { transfer_option_required: payload.transferOptionRequired }
            : {}),
          ...(payload.transferSourceRequired
            ? { transfer_source_required: payload.transferSourceRequired }
            : {}),
          receipt_attach_failed: labels.receiptAttachFailed,
        },
      });
      if (outcome) {
        if (outcome.notifyTakenSeats) {
          payload.onSeatConflict?.(body?.result?.takenSeatKeys ?? payload.seatKeys ?? []);
        }
        setMessage(outcome.message);
        return;
      }

      const attendeeId = body?.result?.attendeeId ?? null;
      const paymentRequired = Boolean(body?.result?.paymentRequired);

      const wantsOnlinePayment =
        payload.showPaymentPicker &&
        payload.allowedPaymentMethods.includes(payload.paymentMethod) &&
        isOnlineGatewayMethod(payload.paymentMethod);
      if (wantsOnlinePayment && attendeeId && paymentRequired) {
        const started = await startEventGatewayPayment({
          slug: payload.slug,
          attendeeId,
          method: payload.paymentMethod as "mercadopago" | "flow",
          email: payload.email,
          dniOrPassport: payload.dni,
          locale: payload.locale,
        });
        if (!started.ok) {
          setMessage(labels.paymentStartFailed);
          return;
        }
        window.location.assign(started.redirectUrl);
        return;
      }

      setSuccessOpen(true);
    } catch {
      setMessage(labels.errors?.network?.trim() || labels.error);
    } finally {
      setUploadingFieldId(null);
      setIsPending(false);
    }
  }

  return { submit, message, isPending, successOpen, setMessage, uploadingFieldId, uploadPercent };
}
