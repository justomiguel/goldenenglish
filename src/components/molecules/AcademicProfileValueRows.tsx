"use client";

import { useState } from "react";
import type { Dictionary } from "@/types/i18n";
import type { AcademicProfileCardField } from "@/lib/academic-profile/academicProfileCard";
import { academicProfileValueSlot } from "@/lib/academic-profile/academicProfileFieldRules";
import { Input } from "@/components/atoms/Input";
import { InlineUploadProgressBar } from "@/components/molecules/InlineUploadProgressBar";
import { prepareAcademicProfileFileUploadAction } from "@/app/[locale]/dashboard/admin/users/academicProfileFileActions";
import { ACADEMIC_PROFILE_FILES_BUCKET } from "@/lib/academic-profile/academicProfileCard";
import { uploadFileToSignedUrlWithProgress } from "@/lib/client/uploadFileToSignedUrlWithProgress";
import { readSupabasePublicEnv } from "@/lib/supabase/publicEnv";
import { EVENT_FORM_FIELD_DEFAULT_MAX_BYTES } from "@/lib/events/validateEventFormFieldFile";

type Labels = Dictionary["admin"]["users"]["academicFields"];

export type AcademicFieldDraft = { text: string; number: string; date: string; path: string };

export function draftFromAcademicField(field: AcademicProfileCardField): AcademicFieldDraft {
  return {
    text: field.valueText ?? "",
    number: field.valueNumber == null ? "" : String(field.valueNumber),
    date: field.valueDate ?? "",
    path: field.storagePath ?? "",
  };
}

export function AcademicProfileValueRows({
  fields,
  drafts,
  labels,
  editing,
  studentId,
  sectionId,
  onChange,
  onError,
}: {
  fields: AcademicProfileCardField[];
  drafts: Record<string, AcademicFieldDraft>;
  labels: Labels;
  editing: boolean;
  studentId: string;
  sectionId?: string;
  onChange: (fieldId: string, draft: AcademicFieldDraft) => void;
  onError: (message: string) => void;
}) {
  const [progress, setProgress] = useState<{ fieldId: string; label: string; value?: number; indeterminate?: boolean } | null>(null);

  return (
    <div className="space-y-3">
      {fields.map((field) => (
        <div key={field.id} className="grid gap-1">
          <span className="text-sm font-medium text-[var(--color-foreground)]">
            {field.label}
            {field.required ? <span className="text-[var(--color-error)]"> *</span> : null}
          </span>
          {editing ? (
            <FieldEditor
              field={field}
              draft={drafts[field.id] ?? draftFromAcademicField(field)}
              labels={labels}
              studentId={studentId}
              sectionId={sectionId}
              progress={progress?.fieldId === field.id ? progress : null}
              onProgress={setProgress}
              onChange={(draft) => onChange(field.id, draft)}
              onError={onError}
            />
          ) : (
            <FieldRead field={field} labels={labels} />
          )}
        </div>
      ))}
    </div>
  );
}

function FieldRead({ field, labels }: { field: AcademicProfileCardField; labels: Labels }) {
  if ((field.fieldType === "image" || field.fieldType === "file") && field.fileUrl) {
    if (field.fieldType === "image") {
      return (
        // Signed URL host changes per tenant. next/image remotePatterns cannot list it.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={field.fileUrl} alt={field.label} className="h-24 w-24 rounded-md object-cover" />
      );
    }
    return (
      <a className="text-sm text-[var(--color-primary)] underline" href={field.fileUrl} target="_blank" rel="noreferrer">
        {labels.openFile}
      </a>
    );
  }
  const slot = academicProfileValueSlot(field.fieldType);
  const text = slot === "number"
    ? (field.valueNumber == null ? "" : String(field.valueNumber))
    : slot === "date"
      ? (field.valueDate ?? "")
      : (field.valueText ?? "");
  return <span className="text-sm text-[var(--color-foreground)]">{text || labels.empty}</span>;
}

function FieldEditor({
  field,
  draft,
  labels,
  studentId,
  sectionId,
  progress,
  onProgress,
  onChange,
  onError,
}: {
  field: AcademicProfileCardField;
  draft: AcademicFieldDraft;
  labels: Labels;
  studentId: string;
  sectionId?: string;
  progress: { label: string; value?: number; indeterminate?: boolean } | null;
  onProgress: (next: { fieldId: string; label: string; value?: number; indeterminate?: boolean } | null) => void;
  onChange: (draft: AcademicFieldDraft) => void;
  onError: (message: string) => void;
}) {
  const slot = academicProfileValueSlot(field.fieldType);
  if (slot === "file") {
    return (
      <div className="space-y-2">
        <input
          type="file"
          accept={field.fieldType === "image" ? "image/*" : undefined}
          aria-label={field.label}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            void upload(file);
          }}
        />
        {progress ? <InlineUploadProgressBar label={progress.label} value={progress.value} indeterminate={progress.indeterminate} /> : null}
      </div>
    );
  }

  async function upload(file: File) {
    if (file.size > EVENT_FORM_FIELD_DEFAULT_MAX_BYTES) {
      onError(labels.tooLarge);
      return;
    }
    onProgress({ fieldId: field.id, label: labels.uploading, value: 0 });
    const prepared = await prepareAcademicProfileFileUploadAction({
      studentId,
      fieldId: field.id,
      sectionId,
      fileName: file.name,
      byteSize: file.size,
    });
    if (!prepared.ok) {
      onProgress(null);
      onError(prepared.error === "too_large" ? labels.tooLarge : prepared.error === "forbidden" ? labels.forbidden : labels.saveError);
      return;
    }
    const { url } = readSupabasePublicEnv();
    if (!url) {
      onProgress(null);
      onError(labels.saveError);
      return;
    }
    onProgress({ fieldId: field.id, label: labels.sending, indeterminate: true });
    try {
      await uploadFileToSignedUrlWithProgress({
        supabaseUrl: url,
        bucket: ACADEMIC_PROFILE_FILES_BUCKET,
        storagePath: prepared.path,
        token: prepared.token,
        file,
        onProgress: (value) => onProgress({ fieldId: field.id, label: labels.sending, value }),
      });
      onChange({ ...draft, path: prepared.path });
    } catch {
      onError(labels.saveError);
    } finally {
      onProgress(null);
    }
  }

  if (field.fieldType === "select") {
    const options = field.selectOptions.includes(draft.text) || !draft.text ? field.selectOptions : [draft.text, ...field.selectOptions];
    return (
      <select className="min-h-11 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm" value={draft.text} aria-label={field.label} onChange={(event) => onChange({ ...draft, text: event.target.value })}>
        <option value="">{labels.empty}</option>
        {options.map((option) => (
          <option key={option} value={option} disabled={!field.selectOptions.includes(option)}>{option}</option>
        ))}
      </select>
    );
  }
  if (field.fieldType === "textarea") {
    return <textarea className="min-h-24 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm" value={draft.text} aria-label={field.label} onChange={(event) => onChange({ ...draft, text: event.target.value })} />;
  }
  const inputType = slot === "number" ? "number" : slot === "date" ? "date" : field.fieldType === "email" ? "email" : field.fieldType === "phone" ? "tel" : "text";
  const value = slot === "number" ? draft.number : slot === "date" ? draft.date : draft.text;
  return (
    <Input
      type={inputType}
      value={value}
      aria-label={field.label}
      onChange={(event) => onChange(slot === "number" ? { ...draft, number: event.target.value } : slot === "date" ? { ...draft, date: event.target.value } : { ...draft, text: event.target.value })}
    />
  );
}
