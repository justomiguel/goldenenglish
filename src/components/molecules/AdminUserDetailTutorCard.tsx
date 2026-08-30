"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Users } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import type { TutorStudentRelationshipCode } from "@/lib/register/tutorStudentRelationship";
import type { AdminUserTutorLinkVM } from "@/lib/dashboard/adminUserDetailVM";
import {
  searchAdminParentsForDetailAction,
  removeAdminStudentTutorLinkAction,
  upsertAdminStudentTutorLinkAction,
} from "@/app/[locale]/dashboard/admin/users/adminUserDetailActions";
import type { AdminStudentSearchHitLike } from "@/components/molecules/AdminStudentSearchCombobox";
import { AdminUserDetailTutorAddPanel } from "@/components/molecules/AdminUserDetailTutorAddPanel";
import { AdminUserDetailTutorDialogs } from "@/components/molecules/AdminUserDetailTutorDialogs";
import { formatAdminTutorRelationshipLabel } from "@/components/molecules/AdminUserDetailTutorRelationshipSelect";
import { AdminUserDetailTutorLinkedRow } from "@/components/molecules/AdminUserDetailTutorLinkedRow";
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
  const [relationship, setRelationship] = useState<TutorStudentRelationshipCode | "">("");
  const [fieldResetKey, setFieldResetKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [unlinkTarget, setUnlinkTarget] = useState<AdminUserTutorLinkVM | null>(null);
  const [unlinkBusy, setUnlinkBusy] = useState(false);
  const [addPanelOpen, setAddPanelOpen] = useState(() => tutorLinks.length === 0);

  useEffect(() => {
    if (tutorLinks.length === 0) {
      setAddPanelOpen(true);
    }
  }, [studentId, tutorLinks.length]);

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
    if (!relationship) {
      onFeedback(labels.detailErrTutorRelationshipRequired, false);
      return;
    }
    setBusy(true);
    try {
      for (const item of queue) {
        const r = await upsertAdminStudentTutorLinkAction({
          locale,
          studentId,
          newTutorId: item.id,
          relationship,
        });
        if (!r.ok) {
          onFeedback(r.message ?? labels.detailErrSave, false);
          return;
        }
      }
      onFeedback(labels.detailToastTutorSaved, true);
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
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-5 shadow-[var(--shadow-soft)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] pb-3">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
          <h2 className="font-display text-lg font-semibold text-[var(--color-primary)]">{labels.detailTutorTitle}</h2>
        </div>
        {showLinkUi ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={rowBusyGlobal}
            onClick={() => setAddPanelOpen(true)}
          >
            <UserPlus className="h-4 w-4 shrink-0" aria-hidden />
            {labels.detailTutorAddOpen}
          </Button>
        ) : null}
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
                locale={locale}
                tutor={t}
                relationshipLabel={formatAdminTutorRelationshipLabel(labels, t.relationshipCode)}
                openProfileLabel={labels.detailTutorOpenProfile}
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
      {showLinkUi && (tutorLinks.length === 0 || addPanelOpen) ? (
        <AdminUserDetailTutorAddPanel
          labels={labels}
          hasTutors={tutorLinks.length > 0}
          rowBusy={rowBusyGlobal}
          busy={busy}
          relationship={relationship}
          onRelationshipChange={setRelationship}
          search={search}
          onPick={addPick}
          fieldResetKey={fieldResetKey}
          linkedTutorIds={linkedTutorIds}
          queue={queue}
          onRemoveFromQueue={removeFromQueue}
          onSave={() => void save()}
          onHide={() => setAddPanelOpen(false)}
          onOpenCreate={() => setCreateOpen(true)}
        />
      ) : null}
      <AdminUserDetailTutorDialogs
        locale={locale}
        studentId={studentId}
        isMinor={isMinor}
        tutorCount={tutorLinks.length}
        labels={labels}
        onFeedback={onFeedback}
        createOpen={createOpen}
        onCreateOpenChange={setCreateOpen}
        unlinkTarget={unlinkTarget}
        onUnlinkTargetChange={setUnlinkTarget}
        unlinkBusy={unlinkBusy}
        onConfirmUnlink={() => void confirmUnlink()}
        onLinked={() => router.refresh()}
      />
    </section>
  );
}
