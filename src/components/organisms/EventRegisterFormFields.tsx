"use client";

import { useId } from "react";
import type { EventFormFieldDefinition } from "@/lib/events/types";
import { Label } from "@/components/atoms/Label";
import { Input } from "@/components/atoms/Input";
import { InlineUploadProgressBar } from "@/components/molecules/InlineUploadProgressBar";
import { EventRegisterCustomFileField } from "@/components/molecules/EventRegisterCustomFileField";
import type { EventRegisterCustomFileFieldLabels } from "@/components/molecules/EventRegisterCustomFileField";
import type { PublicEventSurfaceVariant } from "@/lib/events/publicEventSurfaceVariant";
import {
  publicEventRegisterFieldClass,
  publicEventRegisterLabelClass,
  publicEventRegisterTypography,
} from "@/lib/events/publicEventSurfaceClasses";

interface EventRegisterFormFieldsProps {
  fields: EventFormFieldDefinition[];
  locale: string;
  defaultLocale: string;
  values: Record<string, string>;
  fieldFiles: Record<string, File | null>;
  onChange: (fieldId: string, value: string) => void;
  onFileChange: (fieldId: string, file: File | null) => void;
  onFileValidationError: (fieldId: string, message: string) => void;
  fileFieldErrors: Record<string, string>;
  uploadingFieldId?: string | null;
  selectPlaceholder: string;
  customFileFieldLabels: EventRegisterCustomFileFieldLabels;
  disabled?: boolean;
  surfaceVariant?: PublicEventSurfaceVariant;
}

function pickLabel(map: Record<string, string> | undefined, locale: string, fallback: string): string {
  if (!map) return "";
  return map[locale] ?? map[fallback] ?? Object.values(map)[0] ?? "";
}

function pickOptions(
  map: Record<string, string[]> | undefined,
  locale: string,
  fallback: string,
): string[] {
  if (!map) return [];
  return map[locale] ?? map[fallback] ?? Object.values(map)[0] ?? [];
}

function inputTypeForField(fieldType: EventFormFieldDefinition["fieldType"]): string {
  if (fieldType === "email") return "email";
  if (fieldType === "phone") return "tel";
  if (fieldType === "number") return "number";
  if (fieldType === "date") return "date";
  return "text";
}

function isFileField(fieldType: EventFormFieldDefinition["fieldType"]): boolean {
  return fieldType === "file" || fieldType === "image";
}

export function EventRegisterFormFields({
  fields,
  locale,
  defaultLocale,
  values,
  fieldFiles,
  onChange,
  onFileChange,
  onFileValidationError,
  fileFieldErrors,
  uploadingFieldId,
  selectPlaceholder,
  customFileFieldLabels,
  disabled = false,
  surfaceVariant = "default",
}: EventRegisterFormFieldsProps) {
  const groupId = useId();
  const typography = publicEventRegisterTypography(surfaceVariant);
  const fieldClass = publicEventRegisterFieldClass(surfaceVariant);
  const selectClass =
    surfaceVariant === "espaciozenit"
      ? `w-full rounded-xl border px-3 py-2 text-sm ${fieldClass}`
      : "w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm";
  const textareaClass =
    surfaceVariant === "espaciozenit"
      ? `w-full rounded-xl border px-3 py-2 text-sm ${fieldClass}`
      : "w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm";

  return (
    <div className="space-y-3">
      {fields.map((field) => {
        const fieldId = `${groupId}-${field.id}`;
        const label = pickLabel(field.labelI18n, locale, defaultLocale) || field.fieldKey;
        const help = pickLabel(field.helpTextI18n, locale, defaultLocale);
        const options = pickOptions(field.optionsI18n, locale, defaultLocale);
        const fileError = fileFieldErrors[field.id];

        return (
          <div key={field.id} className="space-y-1.5">
            <Label htmlFor={fieldId} required={field.required} className={publicEventRegisterLabelClass(surfaceVariant)}>
              {label}
            </Label>
            {field.fieldType === "select" ? (
              <select
                id={fieldId}
                value={values[field.id] ?? ""}
                onChange={(event) => onChange(field.id, event.currentTarget.value)}
                required={field.required}
                disabled={disabled}
                aria-describedby={help ? `${fieldId}-help` : undefined}
                className={selectClass}
              >
                <option value="">{selectPlaceholder}</option>
                {options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : field.fieldType === "textarea" ? (
              <textarea
                id={fieldId}
                value={values[field.id] ?? ""}
                onChange={(event) => onChange(field.id, event.currentTarget.value)}
                required={field.required}
                disabled={disabled}
                rows={4}
                aria-describedby={help ? `${fieldId}-help` : undefined}
                className={textareaClass}
              />
            ) : isFileField(field.fieldType) ? (
              <EventRegisterCustomFileField
                field={field}
                labels={customFileFieldLabels}
                file={fieldFiles[field.id] ?? null}
                onFileChange={(file) => onFileChange(field.id, file)}
                onValidationError={(message) => onFileValidationError(field.id, message)}
                disabled={disabled}
                surfaceVariant={surfaceVariant}
              />
            ) : (
              <Input
                id={fieldId}
                type={inputTypeForField(field.fieldType)}
                value={values[field.id] ?? ""}
                onChange={(event) => onChange(field.id, event.currentTarget.value)}
                required={field.required}
                disabled={disabled}
                aria-describedby={help ? `${fieldId}-help` : undefined}
                className={fieldClass}
              />
            )}
            {uploadingFieldId === field.id ? (
              <InlineUploadProgressBar label={label} indeterminate />
            ) : null}
            {fileError ? (
              <p className={`${typography.hint} text-[var(--color-error)]`} role="alert">
                {fileError}
              </p>
            ) : null}
            {help ? (
              <p id={`${fieldId}-help`} className={typography.hint}>
                {help}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
