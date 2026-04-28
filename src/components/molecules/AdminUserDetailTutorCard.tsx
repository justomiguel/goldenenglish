"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, UserPlus, Users } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import type { AdminUserTutorLinkVM } from "@/lib/dashboard/adminUserDetailVM";
import {
  searchAdminParentsForDetailAction,
  removeAdminStudentTutorLinkAction,
  upsertAdminStudentTutorLinkAction,
} from "@/app/[locale]/dashboard/admin/users/adminUserDetailActions";
import type { AdminStudentSearchHitLike } from "@/components/molecules/AdminStudentSearchCombobox";
import { StaffSearchComboboxWithChipQueue } from "@/components/molecules/StaffSearchComboboxWithChipQueue";
import { AdminUserDetailTutorCreateModal } from "@/components/molecules/AdminUserDetailTutorCreateModal";
import { AdminUserDetailTutorLinkedRow } from "@/components/molecules/AdminUserDetailTutorLinkedRow";
import { ConfirmActionModal } from "@/components/molecules/ConfirmActionModal";
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
  const [queue, setQueue] = useState<AdminStudentSearchHitLike[]>([]);
  const [fieldResetKey, setFieldResetKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [unlinkTarget, setUnlinkTarget] = useState<AdminUserTutorLinkVM | null>(null);
  const [unlinkBusy, setUnlinkBusy] = useState(false);

  const search = useCallback((q: string) => searchAdminParentsForDetailAction(q), []);

  const linkedTutorIds = useMemo(() => tutorLinks.map((t) => t.tutorId), [tutorLinks]);

  const addPick = useCallback((hit: AdminStudentSearchHitLike) => {
    setQueue((q) => (q.some((s) => s.id === hit.id) ? q : [...q, hit]));
    setFieldResetKey((k) => k + 1);
  }, []);

  const removeFromQueue = useCallback((id: string) => {
    setQueue((q) => q.filter((s) => s.id !== id));
  }, []);

  const save = async () => {
    if (queue.length === 0) {
      onFeedback(labels.detailTutorPickFirst, false);
      return;
    }
    setBusy(true);
    try {
      for (const item of queue) {
        const r = await upsertAdminStudentTutorLinkAction({
          locale,
          studentId,
          newTutorId: item.id,
        });
        if (!r.ok) {
          onFeedback(r.message ?? labels.detailErrSave, false);
          return;
        }
      }
      onFeedback(labels.detailToastTutorSaved, true);
      setQueue([]);
      setFieldResetKey((k) => k + 1);
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const confirmUnlink = async () => {
    if (!unlinkTarget) return;
    setUnlinkBusy(true);
    try {
      const r = await removeAdminStudentTutorLinkAction({
        locale,
        studentId,
        tutorId: unlinkTarget.tutorId,
      });
      if (r.ok) {
        onFeedback(r.message ?? labels.detailToastTutorUnlinked, true);
        setUnlinkTarget(null);
        router.refresh();
      } else {
        onFeedback(r.message ?? labels.detailErrSave, false);
      }
    } finally {
      setUnlinkBusy(false);
    }
  };

  const rowBusyGlobal = busy || unlinkBusy;
  const showLinkUi = editable;

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
              <AdminUserDetailTutorLinkedRow
                key={t.tutorId}
                tutor={t}
                editable={showLinkUi}
                rowBusy={rowBusyGlobal}
                unlinkLabel={labels.detailTutorUnlink}
                unlinkAriaLabel={`${labels.detailTutorUnlink}: ${t.displayName}`}
                onRequestUnlink={() => setUnlinkTarget(t)}
              />
            ))
          )}
        </ul>
      </div>
      {isMinor && tutorLinks.length === 0 ? (
        <p className="mt-3 rounded-[var(--layout-border-radius)] border border-[var(--color-error)]/40 bg-[var(--color-muted)]/30 p-3 text-sm text-[var(--color-error)]">
          {labels.detailTutorMissingWarning}
        </p>
      ) : null}
      {showLinkUi ? (
        <div className="mt-5 space-y-4 border-t border-[var(--color-border)] pt-4">
          <div className="space-y-3">
            <p className="text-sm text-[var(--color-muted-foreground)]">{labels.detailTutorLinkHint}</p>
            <StaffSearchComboboxWithChipQueue
              id="admin-user-tutor-search"
              labelText={labels.detailTutorSearchLabel}
              placeholder={labels.detailTutorSearchPlaceholder}
              inputTitle={labels.detailTutorSearchTooltip}
              minCharsHint={labels.detailTutorMinChars}
              prefetchWhenEmptyOnFocus
              search={search}
              onPick={addPick}
              resetKey={fieldResetKey}
              persistentExcludeIds={linkedTutorIds}
              selectedItems={queue}
              onRemoveSelected={removeFromQueue}
              queueLegend={labels.detailTutorQueueLegend}
              queueReminder={labels.detailTutorQueueReminder}
              removeChipAriaLabel={labels.detailTutorRemoveChipAria}
              queueDisabled={busy}
              resultsListHeading={labels.detailTutorSearchResultsHeading}
            />
            <Button type="button" variant="primary" size="sm" isLoading={busy} onClick={() => void save()}>
              {!busy ? (
                <Save className="h-4 w-4 shrink-0" aria-hidden />
              ) : null}
              {labels.detailTutorSave}
            </Button>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-[var(--color-muted-foreground)]">{labels.detailTutorCreateIntro}</p>
            <Button type="button" variant="secondary" size="sm" onClick={() => setCreateOpen(true)}>
              <UserPlus className="h-4 w-4 shrink-0" aria-hidden />
              {labels.detailTutorCreateOpen}
            </Button>
          </div>
        </div>
      ) : null}
      <AdminUserDetailTutorCreateModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        locale={locale}
        studentId={studentId}
        labels={labels}
        onFeedback={onFeedback}
        onLinked={() => router.refresh()}
      />
      <ConfirmActionModal
        open={unlinkTarget !== null}
        onOpenChange={(open) => {
          if (!open) setUnlinkTarget(null);
        }}
        title={labels.detailTutorUnlinkConfirmTitle}
        description={labels.detailTutorUnlinkConfirmDescription}
        formSlot={
          isMinor && tutorLinks.length === 1 ? (
            <p className="text-sm font-medium text-[var(--color-error)]">{labels.detailTutorUnlinkLastMinorWarning}</p>
          ) : null
        }
        body={unlinkTarget ? `${unlinkTarget.displayName} — ${unlinkTarget.emailDisplay}` : undefined}
        cancelLabel={labels.detailTutorCreateCancel}
        confirmLabel={labels.detailTutorUnlink}
        confirmVariant="destructive"
        busy={unlinkBusy}
        disableClose={unlinkBusy}
        onConfirm={() => void confirmUnlink()}
      />
    </section>
  );
}
