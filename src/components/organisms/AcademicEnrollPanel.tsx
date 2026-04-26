"use client";

import { useState, useTransition } from "react";
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

export interface SectionOption {
  id: string;
  label: string;
}

export interface AcademicEnrollPanelProps {
  locale: string;
  dict: Dictionary;
  sections: SectionOption[];
}

export function AcademicEnrollPanel({ locale, dict, sections }: AcademicEnrollPanelProps) {
  const d = dict.dashboard.academics.enrollPanel;
  const modalDict = dict.dashboard.academics.conflictModal;
  const [picked, setPicked] = useState<AdminStudentSearchHitLike | null>(null);
  const [fieldResetKey, setFieldResetKey] = useState(0);
  const [sectionId, setSectionId] = useState(sections[0]?.id ?? "");
  const [capacityOverride, setCapacityOverride] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [warnParent, setWarnParent] = useState(false);
  const [conflicts, setConflicts] = useState<SectionEnrollmentConflict[] | null>(null);
  const [targetSlots, setTargetSlots] = useState<SectionScheduleSlot[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [previewPending, startPreview] = useTransition();
  const [enrollPending, startEnroll] = useTransition();
  const busy = previewPending || enrollPending;

  const sectionLabel = sections.find((s) => s.id === sectionId)?.label ?? "";

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
        setWarnParent(Boolean(r.parentPaymentsPending));
        setMsg(d.previewOk);
        return;
      }
      if (r.code === "SCHEDULE_OVERLAP" && r.conflicts?.length && r.targetSlots) {
        setConflicts(r.conflicts);
        setTargetSlots(r.targetSlots);
        setWarnParent(Boolean(r.parentPaymentsPending));
        setModalOpen(true);
        return;
      }
      const err =
        dict.dashboard.academics.errors[r.code as keyof typeof dict.dashboard.academics.errors] ??
        dict.dashboard.academics.errors.RPC;
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
        setMsg(d.enrollOk);
        setPicked(null);
        setFieldResetKey((k) => k + 1);
        return;
      }
      const err =
        dict.dashboard.academics.errors[r.code as keyof typeof dict.dashboard.academics.errors] ??
        dict.dashboard.academics.errors.RPC;
      setMsg(err);
    });
  };

  if (sections.length === 0) {
    return <p className="text-sm text-[var(--color-muted-foreground)]">{d.noSections}</p>;
  }

  return (
    <div className="max-w-xl space-y-4 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <AdminStudentSearchCombobox
        id="academic-enroll-panel-student"
        labelText={d.studentSearchLabel}
        placeholder={d.searchPlaceholder}
        inputTitle={d.studentSearchTooltip}
        minCharsHint={d.searchMin}
        disabled={busy}
        search={searchAdminStudentsAction}
        onPick={setPicked}
        resetKey={fieldResetKey}
      />
      <div>
        <label className="block text-sm font-medium" htmlFor="ae-section">
          {d.sectionLabel}
        </label>
        <select
          id="ae-section"
          className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
          value={sectionId}
          onChange={(e) => setSectionId(e.target.value)}
        >
          {sections.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={capacityOverride}
          onChange={(e) => setCapacityOverride(e.target.checked)}
        />
        {d.capacityOverride}
      </label>
      {warnParent ? (
        <p className="text-sm font-medium text-[var(--color-error)]">{d.parentPendingWarning}</p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="ghost"
          disabled={busy || !picked}
          isLoading={previewPending}
          onClick={runPreview}
        >
          {!previewPending ? <Eye className="h-4 w-4 shrink-0" aria-hidden /> : null}
          {d.preview}
        </Button>
        <Button
          type="button"
          disabled={busy || !picked}
          isLoading={enrollPending}
          onClick={() => runEnroll(null)}
        >
          {!enrollPending ? <UserPlus className="h-4 w-4 shrink-0" aria-hidden /> : null}
          {d.enroll}
        </Button>
      </div>
      {msg ? <p className="text-sm text-[var(--color-foreground)]">{msg}</p> : null}
      <ScheduleConflictResolutionModal
        open={modalOpen && Boolean(conflicts?.length)}
        onClose={() => setModalOpen(false)}
        locale={locale}
        dict={modalDict}
        conflicts={conflicts ?? []}
        targetSlots={targetSlots}
        targetSectionLabel={sectionLabel}
        onConfirmDrop={(enrollmentId) => runEnroll(enrollmentId)}
        isPending={enrollPending}
      />
    </div>
  );
}
