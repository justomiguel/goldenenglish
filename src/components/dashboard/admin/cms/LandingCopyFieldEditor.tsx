"use client";

import { useId } from "react";
import { Input } from "@/components/atoms/Input";
import type { LandingCopyFieldDescriptor } from "@/lib/cms/buildLandingEditorViewModel";
import type { Dictionary } from "@/types/i18n";

type Labels = Dictionary["admin"]["cms"]["templates"]["landing"];

export interface LandingCopyFieldEditorProps {
  field: LandingCopyFieldDescriptor;
  labels: Labels;
  draftEs: string;
  draftEn: string;
  onChangeEs: (value: string) => void;
  onChangeEn: (value: string) => void;
  disabled?: boolean;
}

function shouldUseTextarea(value: string): boolean {
  return value.length > 90 || value.includes("\n");
}

export function LandingCopyFieldEditor({
  field,
  labels,
  draftEs,
  draftEn,
  onChangeEs,
  onChangeEn,
  disabled,
}: LandingCopyFieldEditorProps) {
  const useTextarea =
    shouldUseTextarea(field.defaults.es) || shouldUseTextarea(field.defaults.en);

  return (
    <fieldset className="space-y-2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <legend className="px-1 text-xs font-mono text-[var(--color-muted-foreground)]">
        {field.key}
      </legend>
      <div className="grid gap-3 md:grid-cols-2">
        <LocaleField
          locale="es"
          label={labels.labelEs}
          defaultValue={field.defaults.es}
          value={draftEs}
          onChange={onChangeEs}
          disabled={disabled}
          useTextarea={useTextarea}
        />
        <LocaleField
          locale="en"
          label={labels.labelEn}
          defaultValue={field.defaults.en}
          value={draftEn}
          onChange={onChangeEn}
          disabled={disabled}
          useTextarea={useTextarea}
        />
      </div>
    </fieldset>
  );
}

interface LocaleFieldProps {
  locale: "es" | "en";
  label: string;
  defaultValue: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  useTextarea: boolean;
}

function LocaleField({
  locale,
  label,
  defaultValue,
  value,
  onChange,
  disabled,
  useTextarea,
}: LocaleFieldProps) {
  const baseId = useId();
  const id = `landing-copy-${locale}-${baseId}`;
  return (
    <div className="space-y-1">
      <label
        htmlFor={id}
        className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]"
      >
        {label}
      </label>
      {useTextarea ? (
        <textarea
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={defaultValue}
          disabled={disabled}
          rows={3}
          className="w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] disabled:cursor-not-allowed disabled:opacity-60"
        />
      ) : (
        <Input
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={defaultValue}
          disabled={disabled}
        />
      )}
      <p className="truncate text-xs text-[var(--color-muted-foreground)]">
        {defaultValue}
      </p>
    </div>
  );
}
