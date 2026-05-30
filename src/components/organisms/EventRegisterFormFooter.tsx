"use client";

import { Send } from "lucide-react";
import { InlineUploadProgressBar } from "@/components/molecules/InlineUploadProgressBar";
import { EventRegisterConsent } from "@/components/organisms/EventRegisterConsent";

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
}: EventRegisterFormFooterProps) {
  return (
    <>
      <EventRegisterConsent checked={consent} onChange={onConsentChange} label={consentLabel} />
      <p className="text-xs text-[var(--color-muted-foreground)]">{captchaRequired}</p>

      {receiptFieldError ? (
        <p className="text-sm text-[var(--color-error)]" role="alert">
          {receiptFieldError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending || !consent}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary-foreground)] disabled:opacity-60"
      >
        <Send className="h-4 w-4" aria-hidden />
        {submitLabel}
      </button>

      {isPending ? (
        <InlineUploadProgressBar
          label={fileUploadProgressSending}
          indeterminate
          className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/15 px-3 py-3"
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
