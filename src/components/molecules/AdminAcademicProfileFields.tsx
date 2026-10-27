"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil, Plus, Settings } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { ConfirmActionModal } from "@/components/molecules/ConfirmActionModal";
import { AcademicProfileFieldModal } from "@/components/molecules/AcademicProfileFieldModal";
import {
  AcademicProfileValueRows,
  draftFromAcademicField,
  type AcademicFieldDraft,
} from "@/components/molecules/AcademicProfileValueRows";
import type { Dictionary } from "@/types/i18n";
import type { AcademicProfileCardField } from "@/lib/academic-profile/academicProfileCard";
import { academicProfileValueSlot } from "@/lib/academic-profile/academicProfileFieldRules";
import { archiveAcademicProfileFieldAction } from "@/app/[locale]/dashboard/admin/users/academicProfileFieldActions";
import { saveAcademicProfileValueAction } from "@/app/[locale]/dashboard/admin/users/academicProfileValueActions";

type Labels = Dictionary["admin"]["users"]["academicFields"];

export function AdminAcademicProfileFields({
  locale,
  studentId,
  editable,
  fields,
  labels,
  sectionId,
  canDefine = true,
}: {
  locale: string;
  studentId: string;
  editable: boolean;
  fields: AcademicProfileCardField[];
  labels: Labels;
  sectionId?: string;
  canDefine?: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, AcademicFieldDraft>>({});
  const [modalField, setModalField] = useState<AcademicProfileCardField | null | undefined>(undefined);
  const [archiveId, setArchiveId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const shown = useMemo(() => fields, [fields]);

  function startEdit() {
    setDrafts(Object.fromEntries(shown.map((field) => [field.id, draftFromAcademicField(field)])));
    setError(null);
    setEditing(true);
  }

  async function done() {
    const missing = shown.some((field) => field.required && draftEmpty(field, drafts[field.id]));
    if (missing) {
      setError(labels.requiredError);
      return;
    }
    setBusy(true);
    for (const field of shown) {
      const draft = drafts[field.id] ?? draftFromAcademicField(field);
      const result = await saveAcademicProfileValueAction(payloadFor(locale, studentId, sectionId, field, draft));
      if (!result.ok) {
        setBusy(false);
        setError(result.error === "required" ? labels.requiredError : result.error === "forbidden" ? labels.forbidden : labels.saveError);
        return;
      }
    }
    setBusy(false);
    setEditing(false);
    router.refresh();
  }

  return (
    <div className="space-y-3 border-t border-[var(--color-border)] pt-3">
      {editable ? (
        <div className="flex flex-wrap gap-2">
          {editing ? (
            <Button type="button" isLoading={busy} onClick={() => void done()}>
              <Check className="h-4 w-4" aria-hidden />
              {labels.done}
            </Button>
          ) : (
            <Button type="button" variant="secondary" onClick={startEdit}>
              <Pencil className="h-4 w-4" aria-hidden />
              {labels.edit}
            </Button>
          )}
          {editing && canDefine ? (
            <Button type="button" variant="secondary" onClick={() => setModalField(null)}>
              <Plus className="h-4 w-4" aria-hidden />
              {labels.addField}
            </Button>
          ) : null}
        </div>
      ) : null}
      <AcademicProfileValueRows
        fields={shown}
        drafts={drafts}
        labels={labels}
        editing={editing}
        studentId={studentId}
        sectionId={sectionId}
        onChange={(fieldId, draft) => setDrafts((current) => ({ ...current, [fieldId]: draft }))}
        onError={setError}
      />
      {editing && canDefine
        ? shown.map((field) => (
            <Button key={field.id} type="button" variant="ghost" onClick={() => setModalField(field)}>
              <Settings className="h-4 w-4" aria-hidden />
              {`${labels.fieldSettings}: ${field.label}`}
            </Button>
          ))
        : null}
      {error ? <p className="text-sm text-[var(--color-error)]">{error}</p> : null}
      <AcademicProfileFieldModal
        open={modalField !== undefined}
        locale={locale}
        labels={labels}
        field={modalField ?? null}
        onOpenChange={(open) => { if (!open) setModalField(undefined); }}
        onSaved={() => { setModalField(undefined); router.refresh(); }}
        onArchive={(fieldId) => { setModalField(undefined); setArchiveId(fieldId); }}
      />
      <ConfirmActionModal
        open={archiveId !== null}
        onOpenChange={(open) => { if (!open) setArchiveId(null); }}
        title={labels.archiveTitle}
        body={labels.archiveBody}
        cancelLabel={labels.cancel}
        confirmLabel={labels.archive}
        confirmVariant="destructive"
        onConfirm={() => void confirmArchive()}
      />
    </div>
  );

  async function confirmArchive() {
    if (!archiveId) return;
    const result = await archiveAcademicProfileFieldAction({ locale, fieldId: archiveId });
    setArchiveId(null);
    if (!result.ok) {
      setError(result.error === "forbidden" ? labels.forbidden : labels.saveError);
      return;
    }
    router.refresh();
  }
}

function draftEmpty(field: AcademicProfileCardField, draft: AcademicFieldDraft | undefined): boolean {
  if (!draft) return true;
  const slot = academicProfileValueSlot(field.fieldType);
  if (slot === "number") return draft.number.trim() === "";
  if (slot === "date") return draft.date.trim() === "";
  if (slot === "file") return draft.path.trim() === "";
  return draft.text.trim() === "";
}

function payloadFor(
  locale: string,
  studentId: string,
  sectionId: string | undefined,
  field: AcademicProfileCardField,
  draft: AcademicFieldDraft,
) {
  const slot = academicProfileValueSlot(field.fieldType);
  return {
    locale,
    studentId,
    fieldId: field.id,
    sectionId,
    valueText: slot === "text" ? draft.text : null,
    valueNumber: slot === "number" && draft.number.trim() !== "" ? Number(draft.number) : null,
    valueDate: slot === "date" ? draft.date : null,
    storagePath: slot === "file" ? draft.path : null,
  };
}
