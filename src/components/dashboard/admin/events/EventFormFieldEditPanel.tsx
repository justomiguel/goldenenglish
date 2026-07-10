"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Save, X } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import { updateEventFormFieldAction } from "@/app/[locale]/dashboard/admin/events/actions";
import { EventFormFieldTypeConfigPanel } from "@/components/dashboard/admin/events/EventFormFieldTypeConfigPanel";
import { parseEventFormFieldAllowedMimeTypes } from "@/lib/events/parseEventFormFieldAllowedMimeTypes";
import {
  createDefaultSelectOptionRows,
  sanitizeEventFormFieldSelectOptions,
} from "@/lib/events/sanitizeEventFormFieldSelectOptions";
import type { EventFormFieldDefinition, EventFormFieldType } from "@/lib/events/types";

export interface EventFormFieldEditLabels {
  title: string;
  fieldKeyLabel: string;
  fieldKeyReadOnlyHint: string;
  fieldTypeLabel: string;
  fieldLabelLabel: string;
  requiredLabel: string;
  saveButton: string;
  cancelButton: string;
  errorSave: string;
  errorValidation: string;
  errorSelectOptions: string;
  fieldTypes: Record<EventFormFieldType, string>;
  previewTitle: string;
  previewPlaceholder: Record<Exclude<EventFormFieldType, "select">, string>;
  selectOptions: {
    title: string;
    hint: string;
    optionLabel: string;
    addOption: string;
    removeOptionAria: string;
  };
  fileTypesLabel: string;
  fileTypesHint: string;
}

interface EventFormFieldEditPanelProps {
  locale: string;
  defaultLocale: string;
  field: EventFormFieldDefinition;
  labels: EventFormFieldEditLabels;
  onCancel: () => void;
}

function pickLabel(
  labels: Record<string, string> | undefined,
  locale: string,
  fallback: string,
) {
  if (!labels) return "";
  return labels[locale] ?? labels[fallback] ?? Object.values(labels)[0] ?? "";
}

function pickOptions(
  optionsI18n: Record<string, string[]> | undefined,
  locale: string,
  defaultLocale: string,
): string[] {
  if (!optionsI18n) return createDefaultSelectOptionRows();
  const options =
    optionsI18n[locale] ?? optionsI18n[defaultLocale] ?? Object.values(optionsI18n)[0] ?? [];
  return options.length >= 2 ? [...options] : createDefaultSelectOptionRows();
}

export function EventFormFieldEditPanel({
  locale,
  defaultLocale,
  field,
  labels,
  onCancel,
}: EventFormFieldEditPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldLabel, setFieldLabel] = useState(() =>
    pickLabel(field.labelI18n, locale, defaultLocale),
  );
  const [required, setRequired] = useState(field.required);
  const [selectOptions, setSelectOptions] = useState(() =>
    pickOptions(field.optionsI18n, locale, defaultLocale),
  );
  const [allowedMimeTypes, setAllowedMimeTypes] = useState(
    () => (field.allowedMimeTypes ?? []).join(", "),
  );

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedLabel = fieldLabel.trim();
    if (!trimmedLabel) {
      setError(labels.errorValidation);
      return;
    }

    let nextSelectOptions: string[] | undefined;
    if (field.fieldType === "select") {
      const sanitized = sanitizeEventFormFieldSelectOptions(selectOptions);
      if (!sanitized.ok) {
        setError(labels.errorSelectOptions);
        return;
      }
      nextSelectOptions = sanitized.values;
    }

    const mimeTypes =
      field.fieldType === "file" || field.fieldType === "image"
        ? parseEventFormFieldAllowedMimeTypes(allowedMimeTypes)
        : undefined;

    startTransition(async () => {
      const result = await updateEventFormFieldAction({
        locale,
        fieldId: field.id,
        label: trimmedLabel,
        required,
        selectOptions: nextSelectOptions,
        allowedMimeTypes: mimeTypes,
      });
      if (!result.ok) {
        setError(
          result.message === "invalid_select_options"
            ? labels.errorSelectOptions
            : labels.errorSave,
        );
        return;
      }
      onCancel();
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-4"
    >
      <h3 className="text-sm font-semibold text-[var(--color-foreground)]">{labels.title}</h3>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <Label htmlFor={`event-field-edit-key-${field.id}`}>{labels.fieldKeyLabel}</Label>
          <Input
            id={`event-field-edit-key-${field.id}`}
            value={field.fieldKey}
            disabled
            readOnly
            className="mt-1"
          />
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
            {labels.fieldKeyReadOnlyHint}
          </p>
        </div>
        <div>
          <Label htmlFor={`event-field-edit-type-${field.id}`}>{labels.fieldTypeLabel}</Label>
          <Input
            id={`event-field-edit-type-${field.id}`}
            value={labels.fieldTypes[field.fieldType]}
            disabled
            readOnly
            className="mt-1"
          />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor={`event-field-edit-label-${field.id}`}>{labels.fieldLabelLabel}</Label>
          <Input
            id={`event-field-edit-label-${field.id}`}
            value={fieldLabel}
            onChange={(e) => setFieldLabel(e.target.value)}
            disabled={pending}
            required
            className="mt-1"
          />
        </div>

        <EventFormFieldTypeConfigPanel
          fieldType={field.fieldType}
          fieldLabel={fieldLabel}
          selectOptions={selectOptions}
          onSelectOptionsChange={setSelectOptions}
          allowedMimeTypes={allowedMimeTypes}
          onAllowedMimeTypesChange={setAllowedMimeTypes}
          disabled={pending}
          mimeInputId={`event-field-edit-mime-${field.id}`}
          labels={{
            previewTitle: labels.previewTitle,
            previewPlaceholder: labels.previewPlaceholder,
            selectOptions: labels.selectOptions,
            fileTypesLabel: labels.fileTypesLabel,
            fileTypesHint: labels.fileTypesHint,
          }}
        />

        <div className="md:col-span-2">
          <label className="inline-flex min-h-[44px] items-center gap-2 text-sm text-[var(--color-foreground)]">
            <input
              type="checkbox"
              checked={required}
              onChange={(e) => setRequired(e.currentTarget.checked)}
              disabled={pending}
              className="h-4 w-4 rounded border-[var(--color-border)]"
            />
            {labels.requiredLabel}
          </label>
        </div>
      </div>
      {error ? (
        <p className="text-sm text-[var(--color-error)]" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" isLoading={pending} disabled={pending}>
          {!pending ? <Save className="h-4 w-4 shrink-0" aria-hidden /> : null}
          {labels.saveButton}
        </Button>
        <Button type="button" variant="ghost" disabled={pending} onClick={onCancel}>
          <X className="h-4 w-4 shrink-0" aria-hidden />
          {labels.cancelButton}
        </Button>
      </div>
    </form>
  );
}
