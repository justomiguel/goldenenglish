"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  removeAdminStudentTutorLinkAction,
  upsertAdminStudentTutorLinkAction,
} from "@/app/[locale]/dashboard/admin/users/adminUserDetailActions";
import { searchAdminStudentsAction } from "@/app/[locale]/dashboard/admin/academic/cohortActions";
import type { TutorStudentRelationshipCode } from "@/lib/register/tutorStudentRelationship";
import { Button } from "@/components/atoms/Button";
import type { AdminStudentSearchHitLike } from "@/components/molecules/AdminStudentSearchCombobox";
import { AdminUserDetailTutorFamilyScholarshipModal } from "@/components/molecules/AdminUserDetailTutorFamilyScholarshipModal";
import { AdminUserDetailTutorFamilyLinkStudentsPanel } from "@/components/molecules/AdminUserDetailTutorFamilyLinkStudentsPanel";
import { AdminUserDetailTutorFamilyStudentRow } from "@/components/molecules/AdminUserDetailTutorFamilyStudentRow";
import { AdminUserDetailTutorFamilyUnlinkConfirmModal } from "@/components/molecules/AdminUserDetailTutorFamilyUnlinkConfirmModal";
import { formatAdminTutorRelationshipLabel } from "@/components/molecules/AdminUserDetailTutorRelationshipSelect";
import type {
  AdminUserTutorFamilySectionOptionVM,
  AdminUserTutorFamilyStudentVM,
} from "@/lib/dashboard/adminUserDetailVM";
import type { Dictionary, Locale } from "@/types/i18n";
import { Percent, UserPlus, Users } from "lucide-react";

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
  const [linkStudentsPanelOpen, setLinkStudentsPanelOpen] = useState(() => linkedStudents.length === 0);

  useEffect(() => {
    if (linkedStudents.length === 0) {
      setLinkStudentsPanelOpen(true);
    }
  }, [tutorId, linkedStudents.length]);

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
      setLinkStudentsPanelOpen(false);
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
        <>
          {linkedStudents.length > 0 && !linkStudentsPanelOpen ? (
            <div className="mt-5 border-t border-[var(--color-border)] pt-4">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={rowBusyGlobal}
                onClick={() => setLinkStudentsPanelOpen(true)}
              >
                <UserPlus className="h-4 w-4 shrink-0" aria-hidden />
                {labels.detailTutorFamilyShowLinkStudentsPanel}
              </Button>
            </div>
          ) : null}
          {(linkedStudents.length === 0 || linkStudentsPanelOpen) && (
            <AdminUserDetailTutorFamilyLinkStudentsPanel
              labels={labels}
              hasLinkedStudents={linkedStudents.length > 0}
              onHide={() => setLinkStudentsPanelOpen(false)}
              relationship={relationship}
              onRelationshipChange={setRelationship}
              busy={busy}
              search={search}
              onPick={addPick}
              fieldResetKey={fieldResetKey}
              linkedStudentIds={linkedStudentIds}
              queue={queue}
              onRemoveFromQueue={removeFromQueue}
              onSave={saveLinks}
            />
          )}
        </>
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

      <AdminUserDetailTutorFamilyUnlinkConfirmModal
        labels={labels}
        unlinkTarget={unlinkTarget}
        unlinkBusy={unlinkBusy}
        onOpenChange={(open) => {
          if (!open) setUnlinkTarget(null);
        }}
        onConfirm={confirmUnlink}
      />
    </section>
  );
}
