"use client";

import { Upload } from "lucide-react";
import { useId, useRef } from "react";
import {
  EVENT_TRANSFER_RECEIPT_ACCEPT,
  validateEventTransferReceiptFile,
} from "@/lib/events/eventTransferReceiptLimits";
import type { PublicEventSurfaceVariant } from "@/lib/events/publicEventSurfaceVariant";
import {
  publicEventRegisterPanelClass,
  publicEventRegisterTypography,
  publicEventRegisterUploadButtonClass,
} from "@/lib/events/publicEventSurfaceClasses";

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
  surfaceVariant?: PublicEventSurfaceVariant;
}

export function EventRegisterTransferReceiptField({
  labels,
  file,
  onFileChange,
  onValidationError,
  disabled = false,
  surfaceVariant = "default",
}: EventRegisterTransferReceiptFieldProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const typography = publicEventRegisterTypography(surfaceVariant);

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
    <section className={publicEventRegisterPanelClass(surfaceVariant)}>
      <h2 className={typography.sectionTitle}>{labels.title}</h2>
      <p className={typography.muted}>{labels.hint}</p>
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
        className={publicEventRegisterUploadButtonClass(surfaceVariant)}
      >
        <Upload className="h-4 w-4 shrink-0" aria-hidden />
        {labels.button}
      </button>
      <p className={typography.muted} aria-live="polite">
        <span className={`break-all font-medium ${typography.body}`}>
          {file?.name ?? labels.noFile}
        </span>
      </p>
    </section>
  );
}
