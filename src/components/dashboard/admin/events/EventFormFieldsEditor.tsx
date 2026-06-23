"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, GripVertical } from "lucide-react";
import { archiveEventFormFieldAction } from "@/app/[locale]/dashboard/admin/events/actions";
import { EventFormBuiltinFieldsSection } from "@/components/dashboard/admin/events/EventFormBuiltinFieldsSection";
import { EventFormCollectBirthDateToggle } from "@/components/dashboard/admin/events/EventFormCollectBirthDateToggle";
import { EventFormFieldAddPanel } from "@/components/dashboard/admin/events/EventFormFieldAddPanel";
import type { EventRegistrationBaseFieldId } from "@/lib/events/eventRegistrationBaseFields";
import type { EventFormFieldDefinition, EventFormFieldType } from "@/lib/events/types";

interface EventFormFieldsEditorProps {
  eventId: string;
  fields: EventFormFieldDefinition[];
  locale: string;
  defaultLocale: string;
  showBirthDateField: boolean;
  showResidencyField: boolean;
  showPaymentField: boolean;
  collectBirthDate: boolean;
  nextFieldPosition: number;
  labels: {
    pageLead: string;
    collectBirthDate: {
      title: string;
      lead: string;
      checkboxLabel: string;
      errorSave: string;
    };
    customFieldsTitle: string;
    customFieldsEmpty: string;
    archive: string;
    baseFields: {
      title: string;
      lead: string;
      requiredBadge: string;
      optionalBadge: string;
      conditionalBadge: string;
      baseFields: Record<EventRegistrationBaseFieldId, string>;
      baseFieldNotes: Partial<Record<EventRegistrationBaseFieldId, string>>;
    };
    addField: {
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
    selectOptionsCount: string;
  };
}

function pickLabel(
  labels: Record<string, string> | undefined,
  locale: string,
  fallback: string,
) {
  if (!labels) return "";
  return labels[locale] ?? labels[fallback] ?? Object.values(labels)[0] ?? "";
}

function countSelectOptions(
  optionsI18n: Record<string, string[]> | undefined,
  locale: string,
  defaultLocale: string,
): number {
  if (!optionsI18n) return 0;
  const options =
    optionsI18n[locale] ?? optionsI18n[defaultLocale] ?? Object.values(optionsI18n)[0] ?? [];
  return options.length;
}

function formatSelectOptionsCount(template: string, count: number): string {
  return template.replace("{{count}}", String(count));
}

export function EventFormFieldsEditor({
  eventId,
  fields,
  locale,
  defaultLocale,
  showBirthDateField,
  showResidencyField,
  showPaymentField,
  collectBirthDate,
  nextFieldPosition,
  labels,
}: EventFormFieldsEditorProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleArchive(fieldId: string) {
    startTransition(async () => {
      const result = await archiveEventFormFieldAction(locale, fieldId);
      if (!result.ok) return;
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--color-muted-foreground)]">{labels.pageLead}</p>

      <EventFormCollectBirthDateToggle
        locale={locale}
        eventId={eventId}
        collectBirthDate={collectBirthDate}
        labels={labels.collectBirthDate}
      />

      <EventFormBuiltinFieldsSection
        showBirthDateField={showBirthDateField}
        showResidencyField={showResidencyField}
        showPaymentField={showPaymentField}
        labels={labels.baseFields}
      />

      <section className="space-y-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <h3 className="text-sm font-semibold text-[var(--color-foreground)]">{labels.customFieldsTitle}</h3>
        {fields.length === 0 ? (
          <p className="text-sm text-[var(--color-muted-foreground)]">{labels.customFieldsEmpty}</p>
        ) : (
          <ul className="space-y-2">
            {fields.map((field) => {
              const optionCount =
                field.fieldType === "select"
                  ? countSelectOptions(field.optionsI18n, locale, defaultLocale)
                  : 0;
              return (
              <li
                key={field.id}
                className="flex items-center justify-between gap-3 rounded-md border border-[var(--color-border)] px-3 py-2 text-sm"
              >
                <span className="inline-flex min-w-0 flex-wrap items-center gap-2">
                  <GripVertical className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="font-medium text-[var(--color-foreground)]">
                    {pickLabel(field.labelI18n, locale, defaultLocale) || field.fieldKey}
                  </span>
                  <span className="rounded-full bg-[var(--color-muted)] px-2 py-0.5 text-xs text-[var(--color-muted-foreground)]">
                    {labels.addField.fieldTypes[field.fieldType]}
                  </span>
                  {field.fieldType === "select" && optionCount > 0 ? (
                    <span className="text-xs text-[var(--color-muted-foreground)]">
                      {formatSelectOptionsCount(labels.selectOptionsCount, optionCount)}
                    </span>
                  ) : null}
                  {field.required ? (
                    <span className="text-xs text-[var(--color-muted-foreground)]">
                      ({labels.baseFields.requiredBadge})
                    </span>
                  ) : null}
                </span>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => handleArchive(field.id)}
                  className="inline-flex shrink-0 items-center gap-2 rounded-md border border-[var(--color-border)] px-2 py-1 disabled:opacity-50"
                >
                  <Archive className="h-4 w-4" aria-hidden />
                  {labels.archive}
                </button>
              </li>
              );
            })}
          </ul>
        )}
      </section>

      <EventFormFieldAddPanel
        locale={locale}
        eventId={eventId}
        nextPosition={nextFieldPosition}
        labels={labels.addField}
      />
    </div>
  );
}
