"use client";

import { Send } from "lucide-react";
import { InlineUploadProgressBar } from "@/components/molecules/InlineUploadProgressBar";
import { EventRegisterConsent } from "@/components/organisms/EventRegisterConsent";
import type { PublicEventSurfaceVariant } from "@/lib/events/publicEventSurfaceVariant";
import {
  publicEventRegisterProgressClass,
  publicEventRegisterSubmitClass,
  publicEventRegisterTypography,
} from "@/lib/events/publicEventSurfaceClasses";

interface EventRegisterFormFooterProps {
  consent: boolean;
  onConsentChange: (checked: boolean) => void;
  consentLabel: string;
  captchaRequired: string;
  receiptFieldError: string;
  submitLabel: string;
  isPending: boolean;
  fileUploadProgressSending: string;
  message: string;
  surfaceVariant?: PublicEventSurfaceVariant;
}

export function EventRegisterFormFooter({
  consent,
  onConsentChange,
  consentLabel,
  captchaRequired,
  receiptFieldError,
  submitLabel,
  isPending,
  fileUploadProgressSending,
  message,
  surfaceVariant = "default",
}: EventRegisterFormFooterProps) {
  const typography = publicEventRegisterTypography(surfaceVariant);

  return (
    <>
      <EventRegisterConsent
        checked={consent}
        onChange={onConsentChange}
        label={consentLabel}
        className={typography.consent}
      />
      <p className={typography.hint}>{captchaRequired}</p>

      {receiptFieldError ? (
        <p className="text-sm text-[var(--color-error)]" role="alert">
          {receiptFieldError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending || !consent}
        className={publicEventRegisterSubmitClass(surfaceVariant)}
      >
        <Send className="h-4 w-4" aria-hidden />
        {submitLabel}
      </button>

      {isPending ? (
        <InlineUploadProgressBar
          label={fileUploadProgressSending}
          indeterminate
          className={publicEventRegisterProgressClass(surfaceVariant)}
        />
      ) : null}

      {message ? (
        <p className="text-sm text-[var(--color-error)]" role="alert">
          {message}
        </p>
      ) : null}
    </>
  );
}
