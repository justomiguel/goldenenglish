"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, UserPlus } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import type { SectionEnrollmentConflict, SectionScheduleSlot } from "@/types/academics";
import { Button } from "@/components/atoms/Button";
import {
  enrollStudentInSectionAction,
  previewSectionEnrollmentAction,
  searchAdminStudentsAction,
} from "@/app/[locale]/dashboard/admin/academics/actions";
import { ScheduleConflictResolutionModal } from "@/components/molecules/ScheduleConflictResolutionModal";
import {
  AdminStudentSearchCombobox,
  type AdminStudentSearchHitLike,
} from "@/components/molecules/AdminStudentSearchCombobox";

export interface AcademicSectionEnrollCardProps {
  locale: string;
  sectionId: string;
  sectionLabel: string;
  dict: Dictionary["dashboard"]["academicSectionPage"];
  conflictDict: Dictionary["dashboard"]["academics"]["conflictModal"];
  errors: Dictionary["dashboard"]["academics"]["errors"];
}

export function AcademicSectionEnrollCard({
  locale,
  sectionId,
  sectionLabel,
  dict,
  conflictDict,
  errors,
}: AcademicSectionEnrollCardProps) {
  const router = useRouter();
  const [picked, setPicked] = useState<AdminStudentSearchHitLike | null>(null);
  const [fieldResetKey, setFieldResetKey] = useState(0);
  const [capacityOverride, setCapacityOverride] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<SectionEnrollmentConflict[] | null>(null);
  const [targetSlots, setTargetSlots] = useState<SectionScheduleSlot[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [previewPending, startPreview] = useTransition();
  const [enrollPending, startEnroll] = useTransition();
  const busy = previewPending || enrollPending;

  const runPreview = () => {
    if (!picked) return;
    setMsg(null);
    setConflicts(null);
    startPreview(async () => {
      const r = await previewSectionEnrollmentAction({
        studentId: picked.id,
        sectionId,
        allowCapacityOverride: capacityOverride,
      });
      if (r.ok) {
        setMsg(dict.previewOk);
        return;
      }
      if (r.code === "SCHEDULE_OVERLAP" && r.conflicts?.length && r.targetSlots) {
        setConflicts(r.conflicts);
        setTargetSlots(r.targetSlots);
        setModalOpen(true);
        return;
      }
      const err = errors[r.code as keyof typeof errors] ?? errors.RPC;
      setMsg(err);
    });
  };

  const runEnroll = (dropEnrollmentId?: string | null) => {
    if (!picked) return;
    setMsg(null);
    startEnroll(async () => {
      const r = await enrollStudentInSectionAction({
        locale,
        studentId: picked.id,
        sectionId,
        dropSectionEnrollmentId: dropEnrollmentId ?? null,
        dropNextStatus: dropEnrollmentId ? "transferred" : undefined,
        allowCapacityOverride: capacityOverride,
      });
      if (r.ok) {
        setModalOpen(false);
        setConflicts(null);
        setMsg(dict.successEnroll);
        setPicked(null);
        setFieldResetKey((k) => k + 1);
        router.refresh();
        return;
      }
      const err = errors[r.code as keyof typeof errors] ?? errors.RPC;
      setMsg(err);
    });
  };

  return (
    <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <h2 className="text-base font-semibold text-[var(--color-primary)]">{dict.enrollTitle}</h2>
      <div className="mt-3 space-y-3">
        <AdminStudentSearchCombobox
          id="academic-section-enroll-student"
          labelText={dict.studentSearchLabel}
          placeholder={dict.searchPlaceholder}
          inputTitle={dict.studentSearchTooltip}
          minCharsHint={dict.searchMin}
          prefetchWhenEmptyOnFocus
          disabled={busy}
          search={searchAdminStudentsAction}
          onPick={setPicked}
          resetKey={fieldResetKey}
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={capacityOverride}
            onChange={(e) => setCapacityOverride(e.target.checked)}
            disabled={busy}
          />
          {dict.capacityOverride}
        </label>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="ghost"
            disabled={busy || !picked}
            isLoading={previewPending}
            onClick={runPreview}
          >
            {!previewPending ? <Eye className="h-4 w-4 shrink-0" aria-hidden /> : null}
            {dict.preview}
          </Button>
          <Button
            type="button"
            disabled={busy || !picked}
            isLoading={enrollPending}
            onClick={() => runEnroll(null)}
          >
            {!enrollPending ? <UserPlus className="h-4 w-4 shrink-0" aria-hidden /> : null}
            {dict.enroll}
          </Button>
        </div>
        {msg ? <p className="text-sm text-[var(--color-foreground)]">{msg}</p> : null}
      </div>
      <ScheduleConflictResolutionModal
        open={modalOpen && Boolean(conflicts?.length)}
        onClose={() => setModalOpen(false)}
        locale={locale}
        dict={conflictDict}
        conflicts={conflicts ?? []}
        targetSlots={targetSlots}
        targetSectionLabel={sectionLabel}
        onConfirmDrop={(enrollmentId) => runEnroll(enrollmentId)}
        isPending={enrollPending}
      />
    </section>
  );
}
