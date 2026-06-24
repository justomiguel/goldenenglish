"use client";

import { useState } from "react";
import type { EventRegistrationPaymentMethod } from "@/lib/events/resolveEventRegistrationPaymentMethods";
import type { EventFormFieldDefinition, EventFieldPayloadEntry } from "@/lib/events/types";
import { validateEventTransferReceiptFile } from "@/lib/events/eventTransferReceiptLimits";
import {
  fillEventFormFieldMaxMbTemplate,
  validateEventFormFieldFile,
} from "@/lib/events/validateEventFormFieldFile";
import { uploadEventPaymentReceipt } from "@/lib/client/uploadEventPaymentReceipt";
import { uploadEventAttendeeFieldFile } from "@/lib/client/uploadEventAttendeeFieldFile";
import { startEventGatewayPayment } from "@/lib/client/startEventGatewayPayment";

function isOnlineGatewayMethod(
  method: EventRegistrationPaymentMethod,
): method is "mercadopago" | "flow" {
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
  showPaymentPicker: boolean;
  requiresTransferReceipt: boolean;
  receiptFile: File | null;
}

export interface EventRegisterSubmitLabels {
  error: string;
  transferReceiptRequired: string;
  transferReceiptUploadFailed: string;
  paymentStartFailed: string;
  customFieldFileRequired: string;
  customFieldFileTooLarge: string;
  customFieldFileInvalidType: string;
  customFieldFileUploadFailed: string;
}

interface UseEventRegisterSubmitArgs {
  labels: EventRegisterSubmitLabels;
}

function buildTextFieldValues(
  fields: EventFormFieldDefinition[],
  fieldValues: Record<string, string>,
): EventFieldPayloadEntry[] {
  return fields
    .filter((field) => !isFileFieldType(field.fieldType))
    .map((field) => ({
      fieldId: field.id,
      valueText: fieldValues[field.id] ?? "",
    }))
    .filter((entry) => Boolean(entry.valueText?.trim()));
}

export function useEventRegisterSubmit({ labels }: UseEventRegisterSubmitArgs) {
  const [message, setMessage] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [uploadingFieldId, setUploadingFieldId] = useState<string | null>(null);

  async function submit(payload: EventRegisterSubmitPayload) {
    setIsPending(true);
    setMessage("");
    setUploadingFieldId(null);

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
      const uploadedFieldValues: EventFieldPayloadEntry[] = [];
      for (const field of fileFields) {
        const file = payload.fieldFiles[field.id];
        if (!file) continue;

        setUploadingFieldId(field.id);
        const uploaded = await uploadEventAttendeeFieldFile({
          slug: payload.slug,
          locale: payload.locale,
          fieldId: field.id,
          email: payload.email,
          dniOrPassport: payload.dni,
          file,
        });
        setUploadingFieldId(null);

        if (!uploaded.ok) {
          setMessage(labels.customFieldFileUploadFailed);
          return;
        }

        uploadedFieldValues.push({
          fieldId: field.id,
          fileStoragePath: uploaded.path,
          fileSizeBytes: uploaded.fileSizeBytes,
          fileMimeType: uploaded.fileMimeType,
        });
      }

      const fieldValues = [...buildTextFieldValues(payload.fields, payload.fieldValues), ...uploadedFieldValues];

      const response = await fetch(`/api/events/${payload.slug}/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          captchaToken: "manual-placeholder",
          locale: payload.locale,
          base: {
            firstName: payload.firstName,
            lastName: payload.lastName,
            dniOrPassport: payload.dni,
            email: payload.email,
            phone: payload.phone,
            ...(payload.birthDate.trim()
              ? { birthDate: payload.birthDate.trim() }
              : {}),
          },
          tutor: payload.isMinor ? payload.tutor : {},
          paymentMethod: payload.showPaymentPicker ? payload.paymentMethod : undefined,
          isLocalResident: payload.isLocalResident,
          fieldValues,
        }),
      });

      const body = (await response.json().catch(() => null)) as
        | {
            ok?: boolean;
            result?: { paymentId?: string | null };
          }
        | null;

      if (!response.ok || !body?.ok) {
        setMessage(labels.error);
        return;
      }

      const paymentId = body.result?.paymentId ?? null;
      if (payload.requiresTransferReceipt && paymentId && payload.receiptFile) {
        const upload = await uploadEventPaymentReceipt({
          slug: payload.slug,
          paymentId,
          email: payload.email,
          dniOrPassport: payload.dni,
          file: payload.receiptFile,
        });
        if (!upload.ok) {
          setMessage(labels.transferReceiptUploadFailed);
          return;
        }
        setSuccessOpen(true);
        return;
      }

      const wantsOnlinePayment =
        payload.showPaymentPicker && isOnlineGatewayMethod(payload.paymentMethod);
      if (wantsOnlinePayment && paymentId) {
        const started = await startEventGatewayPayment({
          slug: payload.slug,
          paymentId,
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
      setMessage(labels.error);
    } finally {
      setUploadingFieldId(null);
      setIsPending(false);
    }
  }

  return { submit, message, isPending, successOpen, setMessage, uploadingFieldId };
}
