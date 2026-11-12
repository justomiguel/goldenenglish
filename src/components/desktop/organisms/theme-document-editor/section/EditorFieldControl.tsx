"use client";

import { Plus, Trash2, ToggleLeft } from "lucide-react";
import type { VariantEditorField } from "@/lib/design-variants/sectionVariant";
import type { DraftOp, DraftScope } from "@/lib/theme-document/editorDraftOps";
import type { Dictionary } from "@/types/i18n";
import { ImageSlotField } from "./ImageSlotField";
import { LocalizedTextField } from "./LocalizedTextField";
import { TextField } from "./TextField";
import { isLocaleMap, textCap } from "./textCap";

export type SectionLabels = Dictionary["admin"]["designEditor"]["section"];

function fill(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce((text, [key, value]) => text.replaceAll(`{${key}}`, value), template);
}

function blankItem(fields: readonly VariantEditorField[]): Record<string, unknown> {
  const item: Record<string, unknown> = {};
  for (const field of fields) {
    if (field.kind === "toggle") item[field.key] = false;
    else if (field.kind === "list") item[field.key] = [];
    else item[field.key] = "";
  }
  return item;
}

export function EditorFieldControl({
  field,
  value,
  scope,
  sectionId,
  fieldLabels,
  labels,
  onApply,
}: {
  field: VariantEditorField;
  value: unknown;
  scope: DraftScope;
  sectionId: string;
  fieldLabels: Record<string, string>;
  labels: SectionLabels;
  onApply: (op: DraftOp) => void;
}) {
  const label = fieldLabels[field.labelKey] ?? field.labelKey;
  const write = (next: unknown) =>
    onApply({ kind: "setField", scope, sectionId, field: field.key, value: next });

  if (field.kind === "text" && isLocaleMap(value)) {
    return (
      <LocalizedTextField
        label={label}
        value={value}
        maxLength={textCap(field)}
        locales={labels.locales}
        onChange={write}
      />
    );
  }

  if (field.kind === "text") {
    const text = typeof value === "string" ? value : "";
    const cap = textCap(field);
    return (
      <TextField
        label={label}
        value={text}
        maxLength={cap}
        counter={fill(labels.counter, { count: String(text.length), max: String(cap) })}
        onChange={write}
      />
    );
  }

  if (field.kind === "longText") {
    const text = typeof value === "string" ? value : "";
    return (
      <label className="flex flex-col gap-1 text-sm text-[var(--color-foreground)]">
        <span>{label}</span>
        <textarea
          aria-label={label}
          maxLength={textCap(field)}
          value={text}
          className="min-h-[88px] rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2"
          onChange={(event) => write(event.target.value)}
        />
      </label>
    );
  }

  if (field.kind === "select") {
    const current = typeof value === "string" ? value : field.options[0] ?? "";
    return (
      <label className="flex flex-col gap-1 text-sm text-[var(--color-foreground)]">
        <span>{label}</span>
        <select
          aria-label={label}
          value={current}
          className="min-h-[44px] rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3"
          onChange={(event) => write(event.target.value)}
        >
          {field.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (field.kind === "toggle") {
    const on = value === true;
    return (
      <button
        type="button"
        role="switch"
        aria-checked={on}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-foreground)]"
        onClick={() => write(!on)}
      >
        <ToggleLeft className="h-4 w-4" aria-hidden />
        {label}
      </button>
    );
  }

  if (field.kind === "image") {
    return (
      <ImageSlotField
        label={label}
        readingLabel={fill(labels.reading, { field: label })}
        sendingLabel={fill(labels.sending, { field: label })}
        failedLabel={labels.readFailed}
        onChange={write}
      />
    );
  }

  if (field.kind !== "list") return null;
  const items = Array.isArray(value) ? value : [];
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-[var(--color-foreground)]">{label}</p>
      {items.map((item, index) => {
        const row = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
        return (
          <div key={index} className="flex flex-col gap-2">
            {field.itemFields.map((itemField) => (
              <EditorFieldControl
                key={itemField.key}
                field={itemField}
                value={row[itemField.key]}
                scope={scope}
                sectionId={sectionId}
                fieldLabels={fieldLabels}
                labels={labels}
                onApply={(op) => {
                  if (op.kind !== "setField") return;
                  const next = items.map((current, rowIndex) =>
                    rowIndex === index ? { ...row, [itemField.key]: op.value } : current,
                  );
                  write(next);
                }}
              />
            ))}
            <button
              type="button"
              aria-label={fill(labels.removeItem, { index: String(index + 1) })}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md border border-[var(--color-border)] text-[var(--color-foreground)]"
              onClick={() => write(items.filter((_, rowIndex) => rowIndex !== index))}
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </button>
          </div>
        );
      })}
      <button
        type="button"
        className="inline-flex min-h-[44px] items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-foreground)]"
        onClick={() => write([...items, blankItem(field.itemFields)])}
      >
        <Plus className="h-4 w-4" aria-hidden />
        {labels.addItem}
      </button>
    </div>
  );
}
