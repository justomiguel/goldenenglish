"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  removeAdminStudentTutorLinkAction,
  upsertAdminStudentTutorLinkAction,
} from "@/app/[locale]/dashboard/admin/users/adminUserDetailActions";
import { searchAdminStudentsAction } from "@/app/[locale]/dashboard/admin/academic/cohortActions";
import type { TutorStudentRelationshipCode } from "@/lib/register/tutorStudentRelationship";
import { Button } from "@/components/atoms/Button";
import { ConfirmActionModal } from "@/components/molecules/ConfirmActionModal";
import type { AdminStudentSearchHitLike } from "@/components/molecules/AdminStudentSearchCombobox";
import { StaffSearchComboboxWithChipQueue } from "@/components/molecules/StaffSearchComboboxWithChipQueue";
import { AdminUserDetailTutorFamilyScholarshipModal } from "@/components/molecules/AdminUserDetailTutorFamilyScholarshipModal";
import { AdminUserDetailTutorFamilyStudentRow } from "@/components/molecules/AdminUserDetailTutorFamilyStudentRow";
import {
  AdminUserDetailTutorRelationshipSelect,
  formatAdminTutorRelationshipLabel,
} from "@/components/molecules/AdminUserDetailTutorRelationshipSelect";
import type {
  AdminUserTutorFamilySectionOptionVM,
  AdminUserTutorFamilyStudentVM,
} from "@/lib/dashboard/adminUserDetailVM";
import type { Dictionary, Locale } from "@/types/i18n";
import { Percent, Save, Users } from "lucide-react";

type UserLabels = Dictionary["admin"]["users"];
type BillingLabels = Dictionary["admin"]["billing"];

export interface AdminUserDetailTutorFamilyCardProps {
  locale: Locale;
  tutorId: string;
  linkedStudents: AdminUserTutorFamilyStudentVM[];
  scholarshipSections: AdminUserTutorFamilySectionOptionVM[];
  labels: UserLabels;
  billingLabels: BillingLabels;
  editable: boolean;
  onFeedback: (text: string, ok: boolean) => void;
}

export function AdminUserDetailTutorFamilyCard({
  locale,
  tutorId,
  linkedStudents,
  scholarshipSections,
  labels,
  billingLabels,
  editable,
  onFeedback,
}: AdminUserDetailTutorFamilyCardProps) {
  const router = useRouter();
  const [queue, setQueue] = useState<AdminStudentSearchHitLike[]>([]);
  const [relationship, setRelationship] = useState<TutorStudentRelationshipCode | "">("");
  const [fieldResetKey, setFieldResetKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [unlinkTarget, setUnlinkTarget] = useState<AdminUserTutorFamilyStudentVM | null>(null);
  const [unlinkBusy, setUnlinkBusy] = useState(false);
  const [scholarshipOpen, setScholarshipOpen] = useState(false);

  const search = useCallback((q: string) => searchAdminStudentsAction(q), []);

  const linkedStudentIds = useMemo(() => linkedStudents.map((s) => s.studentId), [linkedStudents]);

  const addPick = useCallback((hit: AdminStudentSearchHitLike) => {
    setQueue((q) => (q.some((s) => s.id === hit.id) ? q : [...q, hit]));
    setFieldResetKey((k) => k + 1);
  }, []);

  const removeFromQueue = useCallback((id: string) => {
    setQueue((q) => q.filter((s) => s.id !== id));
  }, []);

  const saveLinks = async () => {
    if (queue.length === 0) {
      onFeedback(labels.detailTutorPickStudentFirst, false);
      return;
    }
    if (!relationship) {
      onFeedback(labels.detailErrTutorRelationshipRequired, false);
      return;
    }
    setBusy(true);
    try {
      for (const item of queue) {
        const r = await upsertAdminStudentTutorLinkAction({
          locale,
          studentId: item.id,
          newTutorId: tutorId,
          relationship,
        });
        if (!r.ok) {
          onFeedback(r.message ?? labels.detailErrSave, false);
          return;
        }
      }
      onFeedback(labels.detailToastFamilyStudentsLinked, true);
      setQueue([]);
      setRelationship("");
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
        studentId: unlinkTarget.studentId,
        tutorId,
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

  return (
    <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] pb-3">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
          <h2 className="font-display text-lg font-semibold text-[var(--color-secondary)]">
            {labels.detailTutorFamilyTitle}
          </h2>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={!editable || rowBusyGlobal}
          onClick={() => setScholarshipOpen(true)}
        >
          <Percent className="h-4 w-4 shrink-0" aria-hidden />
          {labels.detailTutorFamilyScholarshipOpen}
        </Button>
      </div>
      <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">{labels.detailTutorFamilyLead}</p>

      <div className="mt-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
          {labels.detailTutorFamilyStudentsHeading}
        </h3>
        <ul className="mt-2 space-y-2">
          {linkedStudents.length === 0 ? (
            <li className="text-sm text-[var(--color-muted-foreground)]">{labels.detailTutorFamilyEmptyStudents}</li>
          ) : (
            linkedStudents.map((s) => (
              <AdminUserDetailTutorFamilyStudentRow
                key={s.studentId}
                locale={locale}
                student={s}
                relationshipLabel={formatAdminTutorRelationshipLabel(labels, s.relationshipCode)}
                labels={labels}
                editable={editable}
                rowBusyGlobal={rowBusyGlobal}
                onRequestUnlink={() => setUnlinkTarget(s)}
              />
            ))
          )}
        </ul>
      </div>

      {editable ? (
        <div className="mt-5 space-y-4 border-t border-[var(--color-border)] pt-4">
          <p className="text-sm text-[var(--color-muted-foreground)]">{labels.detailTutorFamilyLinkStudentsIntro}</p>
          <p className="text-sm text-[var(--color-muted-foreground)]">{labels.detailTutorFamilyLinkRelationshipLead}</p>
          <AdminUserDetailTutorRelationshipSelect
            value={relationship}
            onChange={setRelationship}
            labels={labels}
            disabled={busy}
          />
          <StaffSearchComboboxWithChipQueue
            id="admin-user-tutor-family-student-search"
            labelText={labels.detailTutorFamilyStudentSearchLabel}
            placeholder={labels.detailTutorFamilyStudentSearchPlaceholder}
            inputTitle={labels.detailTutorFamilyStudentSearchTooltip}
            minCharsHint={labels.detailTutorMinChars}
            prefetchWhenEmptyOnFocus
            search={search}
            onPick={addPick}
            resetKey={fieldResetKey}
            persistentExcludeIds={linkedStudentIds}
            selectedItems={queue}
            onRemoveSelected={removeFromQueue}
            queueLegend={labels.detailTutorQueueLegend}
            queueReminder={labels.detailTutorFamilyQueueReminder}
            removeChipAriaLabel={labels.detailTutorRemoveChipAria}
            queueDisabled={busy}
            resultsListHeading={labels.detailTutorFamilyStudentSearchResultsHeading}
          />
          <Button type="button" variant="primary" size="sm" isLoading={busy} onClick={() => void saveLinks()}>
            {!busy ? <Save className="h-4 w-4 shrink-0" aria-hidden /> : null}
            {labels.detailTutorFamilySaveLinks}
          </Button>
        </div>
      ) : null}

      <AdminUserDetailTutorFamilyScholarshipModal
        locale={locale}
        open={scholarshipOpen}
        onOpenChange={setScholarshipOpen}
        tutorId={tutorId}
        sections={scholarshipSections}
        userLabels={labels}
        billingLabels={billingLabels}
        onCompleteMessage={onFeedback}
      />

      <ConfirmActionModal
        open={unlinkTarget !== null}
        onOpenChange={(open) => {
          if (!open) setUnlinkTarget(null);
        }}
        title={labels.detailTutorFamilyUnlinkConfirmTitle}
        description={labels.detailTutorFamilyUnlinkConfirmDescription}
        formSlot={
          unlinkTarget?.isMinor ? (
            <p className="text-sm font-medium text-[var(--color-error)]">{labels.detailTutorFamilyUnlinkMinorWarning}</p>
          ) : null
        }
        body={unlinkTarget ? `${unlinkTarget.displayName} — ${unlinkTarget.emailDisplay}` : undefined}
        cancelLabel={labels.detailTutorCreateCancel}
        confirmLabel={labels.detailTutorFamilyUnlinkStudent}
        confirmVariant="destructive"
        busy={unlinkBusy}
        disableClose={unlinkBusy}
        onConfirm={() => void confirmUnlink()}
      />
    </section>
  );
}
