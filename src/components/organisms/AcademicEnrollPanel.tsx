"use client";

import { useState, useTransition } from "react";
import type { Dictionary } from "@/types/i18n";
import type { SectionEnrollmentConflict, SectionScheduleSlot } from "@/types/academics";
import { Button } from "@/components/atoms/Button";
import {
  enrollStudentInSectionAction,
  previewSectionEnrollmentAction,
} from "@/app/[locale]/dashboard/admin/academics/actions";
import { ScheduleConflictResolutionModal } from "@/components/molecules/ScheduleConflictResolutionModal";

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
  const [studentId, setStudentId] = useState("");
  const [sectionId, setSectionId] = useState(sections[0]?.id ?? "");
  const [capacityOverride, setCapacityOverride] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [warnParent, setWarnParent] = useState(false);
  const [conflicts, setConflicts] = useState<SectionEnrollmentConflict[] | null>(null);
  const [targetSlots, setTargetSlots] = useState<SectionScheduleSlot[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [busy, start] = useTransition();

  const sectionLabel = sections.find((s) => s.id === sectionId)?.label ?? "";

  const runPreview = () => {
    setMsg(null);
    setConflicts(null);
    start(async () => {
      const r = await previewSectionEnrollmentAction({
        studentId: studentId.trim(),
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
    setMsg(null);
    start(async () => {
      const r = await enrollStudentInSectionAction({
        locale,
        studentId: studentId.trim(),
        sectionId,
        dropSectionEnrollmentId: dropEnrollmentId ?? null,
        dropNextStatus: dropEnrollmentId ? "transferred" : undefined,
        allowCapacityOverride: capacityOverride,
      });
      if (r.ok) {
        setModalOpen(false);
        setConflicts(null);
        setMsg(d.enrollOk);
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
      <div>
        <label className="block text-sm font-medium" htmlFor="ae-student">
          {d.studentIdLabel}
        </label>
        <input
          id="ae-student"
          className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          autoComplete="off"
        />
      </div>
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
        <Button type="button" variant="ghost" disabled={busy || !studentId.trim()} onClick={runPreview}>
          {d.preview}
        </Button>
        <Button type="button" disabled={busy || !studentId.trim()} onClick={() => runEnroll(null)}>
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
        isPending={busy}
      />
    </div>
  );
}
