"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import { EVENT_FORM_FIELD_SELECT_MIN_OPTIONS } from "@/lib/events/sanitizeEventFormFieldSelectOptions";

interface EventFormFieldSelectOptionsEditorProps {
  options: string[];
  disabled?: boolean;
  onChange: (options: string[]) => void;
  labels: {
    title: string;
    hint: string;
    optionLabel: string;
    addOption: string;
    removeOptionAria: string;
  };
}

function formatOptionLabel(template: string, index: number): string {
  return template.replace("{{n}}", String(index + 1));
}

export function EventFormFieldSelectOptionsEditor({
  options,
  disabled = false,
  onChange,
  labels,
}: EventFormFieldSelectOptionsEditorProps) {
  function updateOption(index: number, value: string) {
    onChange(options.map((option, i) => (i === index ? value : option)));
  }

  function addOption() {
    onChange([...options, ""]);
  }

  function removeOption(index: number) {
    if (options.length <= EVENT_FORM_FIELD_SELECT_MIN_OPTIONS) return;
    onChange(options.filter((_, i) => i !== index));
  }

  return (
    <section className="space-y-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-3 md:col-span-2">
      <div>
        <h4 className="text-sm font-medium text-[var(--color-foreground)]">{labels.title}</h4>
        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{labels.hint}</p>
      </div>
      <ol className="space-y-2">
        {options.map((option, index) => {
          const optionId = `event-field-option-${index}`;
          const canRemove = options.length > EVENT_FORM_FIELD_SELECT_MIN_OPTIONS;
          return (
            <li key={optionId} className="flex items-end gap-2">
              <div className="min-w-0 flex-1">
                <Label htmlFor={optionId}>{formatOptionLabel(labels.optionLabel, index)}</Label>
                <Input
                  id={optionId}
                  value={option}
                  onChange={(event) => updateOption(index, event.currentTarget.value)}
                  disabled={disabled}
                  className="mt-1"
                  placeholder={formatOptionLabel(labels.optionLabel, index)}
                />
              </div>
              {canRemove ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={disabled}
                  onClick={() => removeOption(index)}
                  aria-label={formatOptionLabel(labels.removeOptionAria, index)}
                  className="shrink-0"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </Button>
              ) : null}
            </li>
          );
        })}
      </ol>
      <Button type="button" variant="secondary" size="sm" disabled={disabled} onClick={addOption}>
        <Plus className="h-4 w-4" aria-hidden />
        {labels.addOption}
      </Button>
    </section>
  );
}
