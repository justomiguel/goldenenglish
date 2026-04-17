"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import type { AdminUserTutorLinkVM } from "@/lib/dashboard/adminUserDetailVM";
import {
  replaceMinorStudentTutorFromDetailAction,
  searchAdminParentsForDetailAction,
} from "@/app/[locale]/dashboard/admin/users/adminUserDetailActions";
import { AdminStudentSearchCombobox } from "@/components/molecules/AdminStudentSearchCombobox";
import { Button } from "@/components/atoms/Button";

type UserLabels = Dictionary["admin"]["users"];

export interface AdminUserDetailTutorCardProps {
  locale: string;
  studentId: string;
  isMinor: boolean;
  tutorLinks: AdminUserTutorLinkVM[];
  labels: UserLabels;
  editable: boolean;
  onFeedback: (message: string, ok: boolean) => void;
}

export function AdminUserDetailTutorCard({
  locale,
  studentId,
  isMinor,
  tutorLinks,
  labels,
  editable,
  onFeedback,
}: AdminUserDetailTutorCardProps) {
  const router = useRouter();
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [pickedLabel, setPickedLabel] = useState("");
  const [resetKey, setResetKey] = useState(0);
  const [busy, setBusy] = useState(false);

  const search = useCallback((q: string) => searchAdminParentsForDetailAction(q), []);

  const onPick = useCallback((hit: { id: string; label: string }) => {
    setPickedId(hit.id);
    setPickedLabel(hit.label);
  }, []);

  const save = async () => {
    if (!pickedId) {
      onFeedback(labels.detailTutorPickFirst, false);
      return;
    }
    setBusy(true);
    try {
      const r = await replaceMinorStudentTutorFromDetailAction({
        locale,
        studentId,
        newTutorId: pickedId,
      });
      if (r.ok) {
        onFeedback(r.message ?? labels.detailToastTutorSaved, true);
        setPickedId(null);
        setPickedLabel("");
        setResetKey((k) => k + 1);
        router.refresh();
      } else {
        onFeedback(r.message ?? labels.detailErrSave, false);
      }
    } finally {
      setBusy(false);
    }
  };

  const showReplaceUi = editable && isMinor;

  return (
    <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2 border-b border-[var(--color-border)] pb-3">
        <Users className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
        <h2 className="font-display text-lg font-semibold text-[var(--color-secondary)]">{labels.detailTutorTitle}</h2>
      </div>
      <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">{labels.detailTutorLead}</p>
      <div className="mt-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">{labels.detailTutorCurrent}</h3>
        <ul className="mt-2 space-y-2 text-sm text-[var(--color-foreground)]">
          {tutorLinks.length === 0 ? (
            <li className="text-[var(--color-muted-foreground)]">{labels.detailNoValue}</li>
          ) : (
            tutorLinks.map((t) => (
              <li key={t.tutorId} className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/20 px-3 py-2">
                <div className="font-medium">{t.displayName}</div>
                <div className="text-xs text-[var(--color-muted-foreground)]">{t.emailDisplay}</div>
              </li>
            ))
          )}
        </ul>
      </div>
      {isMinor && tutorLinks.length === 0 ? (
        <p className="mt-3 rounded-[var(--layout-border-radius)] border border-[var(--color-error)]/40 bg-[var(--color-muted)]/30 p-3 text-sm text-[var(--color-error)]">
          {labels.detailTutorMissingWarning}
        </p>
      ) : null}
      {showReplaceUi ? (
        <div className="mt-5 space-y-3 border-t border-[var(--color-border)] pt-4">
          <p className="text-sm text-[var(--color-muted-foreground)]">{labels.detailTutorReplaceHint}</p>
          <AdminStudentSearchCombobox
            id="admin-user-tutor-search"
            labelText={labels.detailTutorSearchLabel}
            placeholder={labels.detailTutorSearchPlaceholder}
            minCharsHint={labels.detailTutorMinChars}
            search={search}
            onPick={onPick}
            resetKey={resetKey}
          />
          {pickedId ? <p className="text-sm font-medium text-[var(--color-foreground)]">{pickedLabel}</p> : null}
          <Button type="button" variant="primary" size="sm" isLoading={busy} onClick={() => void save()}>
            {labels.detailTutorSave}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
