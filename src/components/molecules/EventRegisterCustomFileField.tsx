"use client";

import { Upload } from "lucide-react";
import { useId, useRef } from "react";
import type { EventFormFieldDefinition } from "@/lib/events/types";
import {
  fillEventFormFieldMaxMbTemplate,
  resolveEventFormFieldAcceptAttr,
  validateEventFormFieldFile,
} from "@/lib/events/validateEventFormFieldFile";
import type { PublicEventSurfaceVariant } from "@/lib/events/publicEventSurfaceVariant";
import {
  publicEventRegisterTypography,
  publicEventRegisterUploadButtonClass,
} from "@/lib/events/publicEventSurfaceClasses";

export interface EventRegisterCustomFileFieldLabels {
  fileButton: string;
  imageButton: string;
  noFile: string;
  required: string;
  tooLarge: string;
  invalidType: string;
  fileInputAriaLabel: string;
  imageInputAriaLabel: string;
}

interface EventRegisterCustomFileFieldProps {
  field: EventFormFieldDefinition;
  labels: EventRegisterCustomFileFieldLabels;
  file: File | null;
  onFileChange: (file: File | null) => void;
  onValidationError: (message: string) => void;
  disabled?: boolean;
  surfaceVariant?: PublicEventSurfaceVariant;
}

export function EventRegisterCustomFileField({
  field,
  labels,
  file,
  onFileChange,
  onValidationError,
  disabled = false,
  surfaceVariant = "default",
}: EventRegisterCustomFileFieldProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const typography = publicEventRegisterTypography(surfaceVariant);
  const isImage = field.fieldType === "image";
  const accept = resolveEventFormFieldAcceptAttr(field);

  function handlePick(next: File | undefined) {
    if (!next || disabled) return;
    const validated = validateEventFormFieldFile(field, next);
    if (!validated.ok) {
      if (validated.code === "too_large") {
        onValidationError(fillEventFormFieldMaxMbTemplate(labels.tooLarge, field));
      } else if (validated.code === "invalid_type") {
        onValidationError(labels.invalidType);
      } else {
        onValidationError(labels.required);
      }
      onFileChange(null);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    onValidationError("");
    onFileChange(next);
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        className="sr-only"
        disabled={disabled}
        aria-label={isImage ? labels.imageInputAriaLabel : labels.fileInputAriaLabel}
        onChange={(event) => handlePick(event.target.files?.[0])}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className={publicEventRegisterUploadButtonClass(surfaceVariant)}
      >
        <Upload className="h-4 w-4 shrink-0" aria-hidden />
        {isImage ? labels.imageButton : labels.fileButton}
      </button>
      <p className={typography.muted} aria-live="polite">
        <span className={`break-all font-medium ${typography.body}`}>
          {file?.name ?? labels.noFile}
        </span>
      </p>
    </div>
  );
}
