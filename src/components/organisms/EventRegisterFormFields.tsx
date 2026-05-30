"use client";

import { useId } from "react";
import type { EventFormFieldDefinition } from "@/lib/events/types";
import { Label } from "@/components/atoms/Label";
import { Input } from "@/components/atoms/Input";
import { InlineUploadProgressBar } from "@/components/molecules/InlineUploadProgressBar";

interface EventRegisterFormFieldsProps {
  fields: EventFormFieldDefinition[];
  locale: string;
  defaultLocale: string;
  values: Record<string, string>;
  onChange: (fieldId: string, value: string) => void;
  uploadingFieldId?: string | null;
  selectPlaceholder: string;
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

export function EventRegisterFormFields({
  fields,
  locale,
  defaultLocale,
  values,
  onChange,
  uploadingFieldId,
  selectPlaceholder,
}: EventRegisterFormFieldsProps) {
  const groupId = useId();

  return (
    <div className="space-y-3">
      {fields.map((field) => {
        const fieldId = `${groupId}-${field.id}`;
        const label = pickLabel(field.labelI18n, locale, defaultLocale) || field.fieldKey;
        const help = pickLabel(field.helpTextI18n, locale, defaultLocale);
        const isFile = field.fieldType === "file" || field.fieldType === "image";
        const options = pickOptions(field.optionsI18n, locale, defaultLocale);

        return (
          <div key={field.id} className="space-y-1.5">
            <Label htmlFor={fieldId} required={field.required}>
              {label}
            </Label>
            {field.fieldType === "select" ? (
              <select
                id={fieldId}
                value={values[field.id] ?? ""}
                onChange={(event) => onChange(field.id, event.currentTarget.value)}
                required={field.required}
                aria-describedby={help ? `${fieldId}-help` : undefined}
                className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
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
                rows={4}
                aria-describedby={help ? `${fieldId}-help` : undefined}
                className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
              />
            ) : isFile ? (
              <Input
                id={fieldId}
                type="text"
                value={values[field.id] ?? ""}
                onChange={(event) => onChange(field.id, event.currentTarget.value)}
                placeholder="uploaded/path.ext"
              />
            ) : (
              <Input
                id={fieldId}
                type={inputTypeForField(field.fieldType)}
                value={values[field.id] ?? ""}
                onChange={(event) => onChange(field.id, event.currentTarget.value)}
                required={field.required}
                aria-describedby={help ? `${fieldId}-help` : undefined}
              />
            )}
            {uploadingFieldId === field.id ? (
              <InlineUploadProgressBar label={label} indeterminate />
            ) : null}
            {help ? (
              <p id={`${fieldId}-help`} className="text-xs text-[var(--color-muted-foreground)]">
                {help}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
