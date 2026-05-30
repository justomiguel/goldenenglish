"use client";

import { Upload } from "lucide-react";
import { useId, useRef } from "react";
import {
  EVENT_TRANSFER_RECEIPT_ACCEPT,
  validateEventTransferReceiptFile,
} from "@/lib/events/eventTransferReceiptLimits";

export interface EventRegisterTransferReceiptFieldLabels {
  title: string;
  button: string;
  hint: string;
  noFile: string;
  required: string;
  tooLarge: string;
  invalidType: string;
  inputAriaLabel: string;
}

interface EventRegisterTransferReceiptFieldProps {
  labels: EventRegisterTransferReceiptFieldLabels;
  file: File | null;
  onFileChange: (file: File | null) => void;
  onValidationError: (message: string) => void;
  disabled?: boolean;
}

export function EventRegisterTransferReceiptField({
  labels,
  file,
  onFileChange,
  onValidationError,
  disabled = false,
}: EventRegisterTransferReceiptFieldProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  function handlePick(next: File | undefined) {
    if (!next || disabled) return;
    const validated = validateEventTransferReceiptFile(next);
    if (!validated.ok) {
      if (validated.code === "too_large") onValidationError(labels.tooLarge);
      else if (validated.code === "invalid_type") onValidationError(labels.invalidType);
      else onValidationError(labels.required);
      onFileChange(null);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    onValidationError("");
    onFileChange(next);
  }

  return (
    <section className="space-y-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <h2 className="text-base font-semibold text-[var(--color-foreground)]">{labels.title}</h2>
      <p className="text-sm text-[var(--color-muted-foreground)]">{labels.hint}</p>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={EVENT_TRANSFER_RECEIPT_ACCEPT}
        className="sr-only"
        disabled={disabled}
        aria-label={labels.inputAriaLabel}
        onChange={(event) => handlePick(event.target.files?.[0])}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[var(--layout-border-radius)] border-2 border-[var(--color-primary)] bg-[var(--color-background)] px-4 py-2 text-sm font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        <Upload className="h-4 w-4 shrink-0" aria-hidden />
        {labels.button}
      </button>
      <p className="text-sm text-[var(--color-muted-foreground)]" aria-live="polite">
        <span className="break-all font-medium text-[var(--color-foreground)]">
          {file?.name ?? labels.noFile}
        </span>
      </p>
    </section>
  );
}
