"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import type { Dictionary, Locale } from "@/types/i18n";
import type { StudentCareNotes } from "@/lib/students/care/loadStudentCareNotes";
import { saveStudentCareNotesAction } from "@/app/[locale]/dashboard/admin/users/adminUserDetailActions";

type UserLabels = Dictionary["admin"]["users"];

export interface AdminUserCarePanelProps {
  locale: Locale;
  userId: string;
  labels: UserLabels;
  editable: boolean;
  /** `null` when the viewer is not entitled to the detail. */
  care: StudentCareNotes | null;
  onFeedback: (text: string, ok: boolean) => void;
}

function formatStamp(locale: Locale, isoDate: string): string {
  const at = new Date(isoDate);
  if (Number.isNaN(at.getTime())) return isoDate;
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).format(at);
}

export function AdminUserCarePanel({
  locale,
  userId,
  labels,
  editable,
  care,
  onFeedback,
}: AdminUserCarePanelProps) {
  const router = useRouter();
  const fieldId = useId();
  const [busy, setBusy] = useState(false);
  const [health, setHealth] = useState(care?.healthNote ?? "");
  const [diet, setDiet] = useState(care?.dietNote ?? "");
  const [support, setSupport] = useState(care?.supportNote ?? "");

  useEffect(() => {
    setHealth(care?.healthNote ?? "");
    setDiet(care?.dietNote ?? "");
    setSupport(care?.supportNote ?? "");
  }, [care?.healthNote, care?.dietNote, care?.supportNote]);

  const save = useCallback(async () => {
    setBusy(true);
    try {
      const result = await saveStudentCareNotesAction({
        locale,
        targetUserId: userId,
        healthNote: health.trim(),
        dietNote: diet.trim(),
        supportNote: support.trim(),
      });
      if (result.ok) {
        onFeedback(result.message ?? labels.detailCareSaved, true);
        router.refresh();
      } else {
        onFeedback(result.message ?? labels.detailErrCareSave, false);
      }
    } finally {
      setBusy(false);
    }
  }, [
    diet,
    health,
    labels.detailCareSaved,
    labels.detailErrCareSave,
    locale,
    onFeedback,
    router,
    support,
    userId,
  ]);

  const header = (
    <header className="space-y-1">
      <h3 className="text-sm font-semibold text-[var(--color-foreground)]">
        {labels.detailCardCare}
      </h3>
      <p className="text-xs text-[var(--color-muted-foreground)]">{labels.detailCareLead}</p>
    </header>
  );

  if (!care) {
    return (
      <section className="space-y-3">
        {header}
        <p className="text-sm text-[var(--color-muted-foreground)]">{labels.detailCareForbidden}</p>
      </section>
    );
  }

  const fields = [
    {
      key: "health",
      label: labels.detailFieldCareHealth,
      hint: labels.detailCareHealthHint,
      value: health,
      onChange: setHealth,
      stored: care.healthNote,
    },
    {
      key: "diet",
      label: labels.detailFieldCareDiet,
      hint: labels.detailCareDietHint,
      value: diet,
      onChange: setDiet,
      stored: care.dietNote,
    },
    {
      key: "support",
      label: labels.detailFieldCareSupport,
      hint: labels.detailCareSupportHint,
      value: support,
      onChange: setSupport,
      stored: care.supportNote,
    },
  ];

  const stamp =
    care.updatedAt && care.updatedByName
      ? labels.detailCareUpdatedBy
          .replace("{name}", care.updatedByName)
          .replace("{date}", formatStamp(locale, care.updatedAt))
      : null;

  if (!editable) {
    const recorded = fields.filter((field) => field.stored);
    return (
      <section className="space-y-3">
        {header}
        {recorded.length === 0 ? (
          <p className="text-sm text-[var(--color-muted-foreground)]">{labels.detailCareEmpty}</p>
        ) : (
          <dl className="space-y-3">
            {recorded.map((field) => (
              <div key={field.key}>
                <dt className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
                  {field.label}
                </dt>
                <dd className="whitespace-pre-line text-sm text-[var(--color-foreground)]">
                  {field.stored}
                </dd>
              </div>
            ))}
          </dl>
        )}
        {stamp ? <p className="text-xs text-[var(--color-muted-foreground)]">{stamp}</p> : null}
      </section>
    );
  }

  return (
    <section className="space-y-4">
      {header}
      {fields.map((field) => (
        <div key={field.key} className="space-y-1">
          <label
            htmlFor={`${fieldId}-${field.key}`}
            className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]"
          >
            {field.label}
          </label>
          <textarea
            id={`${fieldId}-${field.key}`}
            rows={3}
            maxLength={2000}
            value={field.value}
            disabled={busy}
            onChange={(event) => field.onChange(event.target.value)}
            className="w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
          />
          <p className="text-xs text-[var(--color-muted-foreground)]">{field.hint}</p>
        </div>
      ))}
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => void save()}
          className="inline-flex min-h-[40px] items-center rounded-[var(--layout-border-radius)] bg-[var(--color-primary)] px-4 text-sm font-semibold text-[var(--color-primary-foreground)] disabled:opacity-50"
        >
          {labels.detailConfirmSave}
        </button>
        {stamp ? <p className="text-xs text-[var(--color-muted-foreground)]">{stamp}</p> : null}
      </div>
    </section>
  );
}
