"use client";

import { useState } from "react";
import type { EventRegistrationPaymentMethod } from "@/lib/events/resolveEventRegistrationPaymentMethods";
import { validateEventTransferReceiptFile } from "@/lib/events/eventTransferReceiptLimits";
import { uploadEventPaymentReceipt } from "@/lib/client/uploadEventPaymentReceipt";

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
  fieldValues: Record<string, string>;
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
}

interface UseEventRegisterSubmitArgs {
  labels: EventRegisterSubmitLabels;
}

export function useEventRegisterSubmit({ labels }: UseEventRegisterSubmitArgs) {
  const [message, setMessage] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  async function submit(payload: EventRegisterSubmitPayload) {
    setIsPending(true);
    setMessage("");

    if (payload.requiresTransferReceipt) {
      const fileCheck = validateEventTransferReceiptFile(payload.receiptFile);
      if (!fileCheck.ok) {
        setMessage(labels.transferReceiptRequired);
        setIsPending(false);
        return;
      }
    }

    try {
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
            birthDate: payload.birthDate,
          },
          tutor: payload.isMinor ? payload.tutor : {},
          paymentMethod: payload.showPaymentPicker ? payload.paymentMethod : undefined,
          isLocalResident: payload.isLocalResident,
          fieldValues: Object.entries(payload.fieldValues).map(([fieldId, valueText]) => ({
            fieldId,
            valueText,
          })),
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
      }

      setSuccessOpen(true);
    } catch {
      setMessage(labels.error);
    } finally {
      setIsPending(false);
    }
  }

  return { submit, message, isPending, successOpen, setMessage };
}
