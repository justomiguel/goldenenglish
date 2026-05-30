"use client";

import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import { EventFormFieldSelectOptionsEditor } from "@/components/dashboard/admin/events/EventFormFieldSelectOptionsEditor";
import type { EventFormFieldType } from "@/lib/events/types";

interface EventFormFieldTypeConfigPanelProps {
  fieldType: EventFormFieldType;
  fieldLabel: string;
  selectOptions: string[];
  onSelectOptionsChange: (options: string[]) => void;
  allowedMimeTypes: string;
  onAllowedMimeTypesChange: (value: string) => void;
  disabled?: boolean;
  labels: {
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

function previewInputType(fieldType: EventFormFieldType): string {
  if (fieldType === "email") return "email";
  if (fieldType === "phone") return "tel";
  if (fieldType === "number") return "number";
  if (fieldType === "date") return "date";
  return "text";
}

export function EventFormFieldTypeConfigPanel({
  fieldType,
  fieldLabel,
  selectOptions,
  onSelectOptionsChange,
  allowedMimeTypes,
  onAllowedMimeTypesChange,
  disabled = false,
  labels,
}: EventFormFieldTypeConfigPanelProps) {
  if (fieldType === "select") {
    return (
      <EventFormFieldSelectOptionsEditor
        options={selectOptions}
        disabled={disabled}
        onChange={onSelectOptionsChange}
        labels={labels.selectOptions}
      />
    );
  }

  const previewLabel = fieldLabel.trim() || labels.previewPlaceholder[fieldType];

  return (
    <section className="space-y-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-3 md:col-span-2">
      <div>
        <h4 className="text-sm font-medium text-[var(--color-foreground)]">{labels.previewTitle}</h4>
      </div>

      {fieldType === "textarea" ? (
        <textarea
          disabled
          readOnly
          rows={3}
          aria-hidden
          value=""
          placeholder={previewLabel}
          className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-muted-foreground)]"
        />
      ) : fieldType === "file" || fieldType === "image" ? (
        <div className="space-y-3">
          <Input type="file" disabled aria-hidden className="text-sm" />
          <div>
            <Label htmlFor="event-field-mime-types">{labels.fileTypesLabel}</Label>
            <Input
              id="event-field-mime-types"
              value={allowedMimeTypes}
              onChange={(event) => onAllowedMimeTypesChange(event.currentTarget.value)}
              disabled={disabled}
              placeholder="image/jpeg, image/png"
              className="mt-1"
            />
            <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{labels.fileTypesHint}</p>
          </div>
        </div>
      ) : (
        <Input
          type={previewInputType(fieldType)}
          disabled
          readOnly
          aria-hidden
          placeholder={previewLabel}
          className="text-[var(--color-muted-foreground)]"
        />
      )}
    </section>
  );
}
