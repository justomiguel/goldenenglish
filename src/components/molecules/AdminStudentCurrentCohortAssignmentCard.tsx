"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Dictionary } from "@/types/i18n";
import type { AdminStudentCurrentCohortAssignment } from "@/lib/dashboard/loadAdminStudentCurrentCohortAssignment";
import {
  assignStudentToCurrentCohortSectionAction,
  previewStudentCurrentCohortSectionAssignmentAction,
  type StudentCurrentCohortAssignmentCode,
} from "@/app/[locale]/dashboard/admin/users/studentCurrentCohortSectionAssignmentActions";
import { Button } from "@/components/atoms/Button";

type UserLabels = Dictionary["admin"]["users"];

export interface AdminStudentCurrentCohortAssignmentCardProps {
  locale: string;
  studentId: string;
  labels: UserLabels;
  assignment: AdminStudentCurrentCohortAssignment;
}

function sectionOptionLabel(
  labels: UserLabels,
  section: AdminStudentCurrentCohortAssignment["sections"][number],
) {
  const meta = labels.detailSectionAssignOptionMeta
    .replace("{{active}}", String(section.activeCount))
    .replace("{{max}}", String(section.maxStudents))
    .replace("{{teacher}}", section.teacherName);
  return `${section.name} · ${meta}`;
}

function errorMessage(labels: UserLabels, code: StudentCurrentCohortAssignmentCode): string {
  const map: Record<StudentCurrentCohortAssignmentCode, string> = {
    PARSE: labels.detailSectionAssignErrParse,
    UNAUTHORIZED: labels.detailSectionAssignErrUnauthorized,
    NOT_STUDENT: labels.detailSectionAssignErrNotStudent,
    NO_CURRENT_COHORT: labels.detailSectionAssignErrNoCurrent,
    SECTION_NOT_CURRENT: labels.detailSectionAssignErrSectionNotCurrent,
    MULTIPLE_CURRENT_ASSIGNMENTS: labels.detailSectionAssignErrMultipleCurrent,
    ALREADY_ACTIVE: labels.detailSectionAssignAlreadyActive,
    SCHEDULE_OVERLAP: labels.detailSectionAssignErrScheduleOverlap,
    CAPACITY_EXCEEDED: labels.detailSectionAssignErrCapacity,
    RPC: labels.detailSectionAssignErrRpc,
  };
  return map[code] ?? labels.detailSectionAssignErrRpc;
}

export function AdminStudentCurrentCohortAssignmentCard({
  locale,
  studentId,
  labels,
  assignment,
}: AdminStudentCurrentCohortAssignmentCardProps) {
  const router = useRouter();
  const [selectedSectionId, setSelectedSectionId] = useState(
    assignment.current?.sectionId ?? assignment.sections[0]?.id ?? "",
  );
  const [currentSectionName, setCurrentSectionName] = useState(
    assignment.current?.sectionName ?? labels.detailSectionAssignCurrentNone,
  );
  const [currentSectionId, setCurrentSectionId] = useState(assignment.current?.sectionId ?? null);
  const [capacityOverride, setCapacityOverride] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [parentWarning, setParentWarning] = useState(false);
  const [busy, startTransition] = useTransition();

  const selectedSection = useMemo(
    () => assignment.sections.find((section) => section.id === selectedSectionId) ?? null,
    [assignment.sections, selectedSectionId],
  );
  const assignmentBlocked = assignment.hasMultipleCurrentAssignments;
  const unchanged = currentSectionId === selectedSectionId;

  const runPreview = () => {
    if (!selectedSectionId || assignmentBlocked || unchanged) return;
    setMessage(null);
    setParentWarning(false);
    startTransition(async () => {
      const result = await previewStudentCurrentCohortSectionAssignmentAction({
        studentId,
        sectionId: selectedSectionId,
        allowCapacityOverride: capacityOverride,
      });
      if (result.ok) {
        setParentWarning(Boolean(result.parentPaymentsPending));
        setMessage({ text: labels.detailSectionAssignPreviewOk, ok: true });
        return;
      }
      setMessage({ text: errorMessage(labels, result.code), ok: false });
    });
  };

  const runAssign = () => {
    if (!selectedSectionId || assignmentBlocked || unchanged) return;
    setMessage(null);
    startTransition(async () => {
      const result = await assignStudentToCurrentCohortSectionAction({
        locale,
        studentId,
        sectionId: selectedSectionId,
        allowCapacityOverride: capacityOverride,
      });
      if (result.ok) {
        setCurrentSectionName(selectedSection?.name ?? labels.detailSectionAssignCurrentNone);
        setCurrentSectionId(selectedSectionId);
        setMessage({ text: labels.detailSectionAssignSaved, ok: true });
        router.refresh();
        return;
      }
      setMessage({ text: errorMessage(labels, result.code), ok: false });
    });
  };

  return (
    <section className="rounded-[calc(var(--layout-border-radius)*1.35)] border border-[color-mix(in_srgb,var(--color-primary)_22%,var(--color-border))] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
            {assignment.cohortName ?? labels.detailSectionAssignTitle}
          </p>
          <h2 className="mt-1 font-display text-xl font-semibold text-[var(--color-secondary)]">
            {labels.detailSectionAssignTitle}
          </h2>
        </div>
        {currentSectionId ? (
          <span className="rounded-full bg-[var(--color-muted)] px-3 py-1 text-xs font-semibold text-[var(--color-primary)]">
            {currentSectionName}
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
        {labels.detailSectionAssignLead}
      </p>

      {!assignment.cohortId ? (
        <p className="mt-4 text-sm text-[var(--color-muted-foreground)]">{labels.detailSectionAssignNoCurrent}</p>
      ) : null}
      {assignment.cohortId && assignment.sections.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--color-muted-foreground)]">{labels.detailSectionAssignNoSections}</p>
      ) : null}

      {assignment.cohortId && assignment.sections.length > 0 ? (
        <div className="mt-4 space-y-4">
          <div className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
              {labels.detailSectionAssignCurrent}
            </p>
            <p className="mt-1 text-base font-semibold text-[var(--color-foreground)]">{currentSectionName}</p>
          </div>
          <div>
            <label className="block text-sm font-medium" htmlFor="student-current-cohort-section">
              {labels.detailSectionAssignSelect}
            </label>
            <select
              id="student-current-cohort-section"
              title={labels.detailSectionAssignSelectTitle}
              value={selectedSectionId}
              onChange={(event) => setSelectedSectionId(event.target.value)}
              disabled={busy || assignmentBlocked}
              className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm shadow-sm"
            >
              {assignment.sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {sectionOptionLabel(labels, section)}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-start gap-2 rounded-[var(--layout-border-radius)] bg-[var(--color-muted)]/40 p-3 text-sm">
            <input
              type="checkbox"
              checked={capacityOverride}
              onChange={(event) => setCapacityOverride(event.target.checked)}
              disabled={busy || assignmentBlocked}
              className="mt-1"
            />
            {labels.detailSectionAssignCapacityOverride}
          </label>
          {assignmentBlocked ? (
            <p className="text-sm font-medium text-[var(--color-error)]">
              {labels.detailSectionAssignErrMultipleCurrent}
            </p>
          ) : null}
          {unchanged ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              {labels.detailSectionAssignAlreadyActive}
            </p>
          ) : null}
          {parentWarning ? (
            <p className="text-sm font-medium text-[var(--color-error)]">
              {labels.detailSectionAssignParentPending}
            </p>
          ) : null}
          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              type="button"
              variant="ghost"
              disabled={busy || assignmentBlocked || unchanged}
              onClick={runPreview}
              className="min-h-[44px]"
            >
              {labels.detailSectionAssignPreview}
            </Button>
            <Button
              type="button"
              isLoading={busy}
              disabled={busy || assignmentBlocked || unchanged}
              onClick={runAssign}
              className="min-h-[44px]"
            >
              {labels.detailSectionAssignSubmit}
            </Button>
          </div>
        </div>
      ) : null}

      {message ? (
        <p
          role="status"
          className={`mt-4 text-sm ${message.ok ? "text-[var(--color-foreground)]" : "text-[var(--color-error)]"}`}
        >
          {message.text}
        </p>
      ) : null}
    </section>
  );
}
