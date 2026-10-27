"use client";

import { useState } from "react";
import { Archive, Plus } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import { Modal } from "@/components/atoms/Modal";
import type { Dictionary } from "@/types/i18n";
import type { AcademicProfileFieldType } from "@/lib/academic-profile/academicProfileFieldRules";
import { ACADEMIC_PROFILE_FIELD_TYPES } from "@/lib/academic-profile/academicProfileFieldRules";
import type { AcademicProfileCardField } from "@/lib/academic-profile/academicProfileCard";
import { saveAcademicProfileFieldAction } from "@/app/[locale]/dashboard/admin/users/academicProfileFieldActions";

type Labels = Dictionary["admin"]["users"]["academicFields"];

export function AcademicProfileFieldModal({
  open,
  locale,
  labels,
  field,
  onOpenChange,
  onSaved,
  onArchive,
}: {
  open: boolean;
  locale: string;
  labels: Labels;
  field: AcademicProfileCardField | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  onArchive: (fieldId: string) => void;
}) {
  const titleId = "academic-field-modal-title";
  return (
    <Modal open={open} onOpenChange={onOpenChange} titleId={titleId} title={field ? labels.fieldSettings : labels.addField} closeLabel={labels.cancel}>
      <FieldForm key={field?.id ?? "new"} locale={locale} labels={labels} field={field} onSaved={onSaved} onArchive={onArchive} />
    </Modal>
  );
}

function FieldForm({
  locale,
  labels,
  field,
  onSaved,
  onArchive,
}: {
  locale: string;
  labels: Labels;
  field: AcademicProfileCardField | null;
  onSaved: () => void;
  onArchive: (fieldId: string) => void;
}) {
  const [label, setLabel] = useState(field?.label ?? "");
  const [fieldType, setFieldType] = useState<AcademicProfileFieldType>(field?.fieldType ?? "text");
  const [options, setOptions] = useState((field?.selectOptions ?? []).join("\n"));
  const [required, setRequired] = useState(field?.required ?? false);
  const [showColumn, setShowColumn] = useState(field?.showInDirectory ?? false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileType = fieldType === "file" || fieldType === "image";

  async function save() {
    setBusy(true);
    setError(null);
    const result = await saveAcademicProfileFieldAction({
      locale,
      fieldId: field?.id,
      label,
      fieldType,
      selectOptions: options.split("\n").map((line) => line.trim()).filter(Boolean),
      required,
      showInDirectory: fileType ? false : showColumn,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error === "forbidden" ? labels.forbidden : labels.saveError);
      return;
    }
    onSaved();
  }

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="academic-field-name">{labels.name}</Label>
        <Input id="academic-field-name" value={label} onChange={(event) => setLabel(event.target.value)} />
      </div>
      <div>
        <Label htmlFor="academic-field-type">{labels.type}</Label>
        <select
          id="academic-field-type"
          className="mt-1 min-h-11 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm"
          value={fieldType}
          disabled={Boolean(field)}
          onChange={(event) => setFieldType(event.target.value as AcademicProfileFieldType)}
        >
          {ACADEMIC_PROFILE_FIELD_TYPES.map((type) => (
            <option key={type} value={type}>{labels.types[type]}</option>
          ))}
        </select>
      </div>
      {fieldType === "select" ? (
        <div>
          <Label htmlFor="academic-field-options">{labels.options}</Label>
          <textarea
            id="academic-field-options"
            className="mt-1 min-h-24 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
            value={options}
            onChange={(event) => setOptions(event.target.value)}
          />
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{labels.optionsHint}</p>
        </div>
      ) : null}
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={required} onChange={(event) => setRequired(event.target.checked)} />
        {labels.required}
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={fileType ? false : showColumn} disabled={fileType} onChange={(event) => setShowColumn(event.target.checked)} />
        {labels.showColumn}
      </label>
      {error ? <p className="text-sm text-[var(--color-error)]">{error}</p> : null}
      <div className="flex flex-wrap justify-end gap-2">
        {field ? (
          <Button type="button" variant="destructive" onClick={() => onArchive(field.id)}>
            <Archive className="h-4 w-4" aria-hidden />
            {labels.archive}
          </Button>
        ) : null}
        <Button type="button" isLoading={busy} onClick={() => void save()}>
          <Plus className="h-4 w-4" aria-hidden />
          {labels.save}
        </Button>
      </div>
    </div>
  );
}
