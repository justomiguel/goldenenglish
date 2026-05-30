"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import { addEventFormFieldAction } from "@/app/[locale]/dashboard/admin/events/actions";
import { EventFormFieldTypeConfigPanel } from "@/components/dashboard/admin/events/EventFormFieldTypeConfigPanel";
import { normalizeEventFormFieldKey } from "@/lib/events/normalizeEventFormFieldKey";
import { parseEventFormFieldAllowedMimeTypes } from "@/lib/events/parseEventFormFieldAllowedMimeTypes";
import {
  createDefaultSelectOptionRows,
  sanitizeEventFormFieldSelectOptions,
} from "@/lib/events/sanitizeEventFormFieldSelectOptions";
import type { EventFormFieldType } from "@/lib/events/types";

const FIELD_TYPES: EventFormFieldType[] = [
  "text",
  "textarea",
  "number",
  "date",
  "email",
  "phone",
  "select",
  "file",
  "image",
];

interface EventFormFieldAddPanelProps {
  locale: string;
  eventId: string;
  nextPosition: number;
  labels: {
    title: string;
    fieldKeyLabel: string;
    fieldKeyHint: string;
    fieldTypeLabel: string;
    fieldLabelLabel: string;
    requiredLabel: string;
    addButton: string;
    errorSave: string;
    errorValidation: string;
    errorDuplicateKey: string;
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
  };
}

export function EventFormFieldAddPanel({
  locale,
  eventId,
  nextPosition,
  labels,
}: EventFormFieldAddPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldKey, setFieldKey] = useState("");
  const [fieldType, setFieldType] = useState<EventFormFieldType>("text");
  const [fieldLabel, setFieldLabel] = useState("");
  const [required, setRequired] = useState(false);
  const [selectOptions, setSelectOptions] = useState<string[]>(() => createDefaultSelectOptionRows());
  const [allowedMimeTypes, setAllowedMimeTypes] = useState("");

  function handleFieldTypeChange(nextType: EventFormFieldType) {
    setFieldType(nextType);
    if (nextType === "select") {
      setSelectOptions(createDefaultSelectOptionRows());
    } else {
      setSelectOptions([]);
    }
    if (nextType !== "file" && nextType !== "image") {
      setAllowedMimeTypes("");
    }
  }

  function resetForm() {
    setFieldKey("");
    setFieldLabel("");
    setRequired(false);
    setFieldType("text");
    setSelectOptions(createDefaultSelectOptionRows());
    setAllowedMimeTypes("");
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const normalizedKey = normalizeEventFormFieldKey(fieldKey);
    const trimmedLabel = fieldLabel.trim();
    if (!normalizedKey.ok || !trimmedLabel) {
      setError(labels.errorValidation);
      return;
    }

    let optionsI18n: Record<string, string[]> | undefined;
    if (fieldType === "select") {
      const sanitized = sanitizeEventFormFieldSelectOptions(selectOptions);
      if (!sanitized.ok) {
        setError(labels.errorSelectOptions);
        return;
      }
      optionsI18n = { [locale]: sanitized.values };
    }

    const mimeTypes =
      fieldType === "file" || fieldType === "image"
        ? parseEventFormFieldAllowedMimeTypes(allowedMimeTypes)
        : undefined;

    startTransition(async () => {
      const result = await addEventFormFieldAction({
        locale,
        eventId,
        fieldKey: normalizedKey.value,
        fieldType,
        labelI18n: { [locale]: trimmedLabel },
        required,
        position: nextPosition,
        optionsI18n,
        allowedMimeTypes: mimeTypes,
      });
      if (!result.ok) {
        setError(result.message === "duplicate_key" ? labels.errorDuplicateKey : labels.errorSave);
        return;
      }
      resetForm();
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-4"
    >
      <h3 className="text-sm font-semibold text-[var(--color-foreground)]">{labels.title}</h3>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <Label htmlFor="event-field-key">{labels.fieldKeyLabel}</Label>
          <Input
            id="event-field-key"
            value={fieldKey}
            onChange={(e) => setFieldKey(e.target.value)}
            disabled={pending}
            placeholder="school_name"
            className="mt-1"
          />
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{labels.fieldKeyHint}</p>
        </div>
        <div>
          <Label htmlFor="event-field-type">{labels.fieldTypeLabel}</Label>
          <select
            id="event-field-type"
            value={fieldType}
            onChange={(e) => handleFieldTypeChange(e.target.value as EventFormFieldType)}
            disabled={pending}
            className="mt-1 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
          >
            {FIELD_TYPES.map((type) => (
              <option key={type} value={type}>
                {labels.fieldTypes[type]}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="event-field-label">{labels.fieldLabelLabel}</Label>
          <Input
            id="event-field-label"
            value={fieldLabel}
            onChange={(e) => setFieldLabel(e.target.value)}
            disabled={pending}
            required
            className="mt-1"
          />
        </div>

        <EventFormFieldTypeConfigPanel
          fieldType={fieldType}
          fieldLabel={fieldLabel}
          selectOptions={selectOptions}
          onSelectOptionsChange={setSelectOptions}
          allowedMimeTypes={allowedMimeTypes}
          onAllowedMimeTypesChange={setAllowedMimeTypes}
          disabled={pending}
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
      <Button type="submit" isLoading={pending} disabled={pending}>
        {!pending ? <Plus className="h-4 w-4 shrink-0" aria-hidden /> : null}
        {labels.addButton}
      </Button>
    </form>
  );
}
