"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Dictionary } from "@/types/i18n";
import type {
  AdminStudentCurrentCohortAssignment,
  AdminStudentCurrentCohortEnrollment,
} from "@/lib/dashboard/loadAdminStudentCurrentCohortAssignment";
import {
  addStudentToSectionAction,
  removeStudentFromSectionAction,
  previewStudentCurrentCohortSectionAssignmentAction,
  type StudentCurrentCohortAssignmentCode,
} from "@/app/[locale]/dashboard/admin/users/studentCurrentCohortSectionAssignmentActions";
import { ConfirmActionModal } from "@/components/molecules/ConfirmActionModal";
import { AdminStudentSectionsList } from "./AdminStudentSectionsList";
import { AdminStudentAddSectionForm } from "./AdminStudentAddSectionForm";

type UserLabels = Dictionary["admin"]["users"];

export interface AdminStudentCurrentCohortAssignmentCardProps {
  locale: string;
  studentId: string;
  labels: UserLabels;
  assignment: AdminStudentCurrentCohortAssignment;
}

function errorMessage(labels: UserLabels, code: StudentCurrentCohortAssignmentCode): string {
  const map: Partial<Record<StudentCurrentCohortAssignmentCode, string>> = {
    PARSE: labels.detailSectionAssignErrParse,
    UNAUTHORIZED: labels.detailSectionAssignErrUnauthorized,
    NOT_STUDENT: labels.detailSectionAssignErrNotStudent,
    NO_CURRENT_COHORT: labels.detailSectionAssignErrNoCurrent,
    SECTION_NOT_CURRENT: labels.detailSectionAssignErrSectionNotCurrent,
    ALREADY_ACTIVE: labels.detailSectionAssignAlreadyActive,
    SCHEDULE_OVERLAP: labels.detailSectionAssignErrScheduleOverlap,
    CAPACITY_EXCEEDED: labels.detailSectionAssignErrCapacity,
    NOT_ENROLLED: labels.detailSectionAssignErrNotEnrolled,
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
  const [localSections, setLocalSections] = useState(assignment.currentSections);
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [capacityOverride, setCapacityOverride] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [parentWarning, setParentWarning] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<AdminStudentCurrentCohortEnrollment | null>(
    null,
  );
  const [busy, startTransition] = useTransition();

  const localIds = new Set(localSections.map((cs) => cs.sectionId));
  const filteredAvailable = assignment.sections.filter((s) => !localIds.has(s.id));

  const runPreview = () => {
    if (!selectedSectionId) return;
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

  const runAdd = () => {
    if (!selectedSectionId) return;
    setMessage(null);
    startTransition(async () => {
      const result = await addStudentToSectionAction({
        locale,
        studentId,
        sectionId: selectedSectionId,
        allowCapacityOverride: capacityOverride,
      });
      if (result.ok) {
        const sec = assignment.sections.find((s) => s.id === selectedSectionId);
        const newEntry: AdminStudentCurrentCohortEnrollment = {
          enrollmentId: result.enrollmentId,
          sectionId: selectedSectionId,
          sectionName: sec?.name ?? selectedSectionId,
        };
        setLocalSections((prev) => [...prev, newEntry]);
        setMessage({ text: labels.detailSectionAssignSaved, ok: true });
        setSelectedSectionId("");
        router.refresh();
        return;
      }
      setMessage({ text: errorMessage(labels, result.code), ok: false });
    });
  };

  const executeRemove = (enrollment: AdminStudentCurrentCohortEnrollment) => {
    setMessage(null);
    startTransition(async () => {
      const result = await removeStudentFromSectionAction({
        locale,
        studentId,
        enrollmentId: enrollment.enrollmentId,
      });
      if (result.ok) {
        setLocalSections((prev) =>
          prev.filter((cs) => cs.enrollmentId !== enrollment.enrollmentId),
        );
        setMessage({ text: labels.detailSectionAssignRemoved, ok: true });
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
        {localSections.length > 0 && (
          <span className="rounded-full bg-[var(--color-muted)] px-3 py-1 text-xs font-semibold text-[var(--color-primary)]">
            {localSections.length}
          </span>
        )}
      </div>
      <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
        {labels.detailSectionAssignLead}
      </p>

      {!assignment.cohortId && (
        <p className="mt-4 text-sm text-[var(--color-muted-foreground)]">
          {labels.detailSectionAssignNoCurrent}
        </p>
      )}
      {assignment.cohortId && assignment.sections.length === 0 && (
        <p className="mt-4 text-sm text-[var(--color-muted-foreground)]">
          {labels.detailSectionAssignNoSections}
        </p>
      )}

      {assignment.cohortId && assignment.sections.length > 0 && (
        <div className="mt-4 space-y-4">
          <AdminStudentSectionsList
            sections={localSections}
            labels={labels}
            busy={busy}
            onRemove={(e) => setRemoveTarget(e)}
          />
          <AdminStudentAddSectionForm
            availableSections={filteredAvailable}
            labels={labels}
            selectedSectionId={selectedSectionId}
            capacityOverride={capacityOverride}
            busy={busy}
            parentWarning={parentWarning}
            onSelectChange={setSelectedSectionId}
            onCapacityChange={setCapacityOverride}
            onPreview={runPreview}
            onAdd={runAdd}
          />
        </div>
      )}

      {message && (
        <p
          role="status"
          className={`mt-4 text-sm ${message.ok ? "text-[var(--color-foreground)]" : "text-[var(--color-error)]"}`}
        >
          {message.text}
        </p>
      )}

      <ConfirmActionModal
        open={removeTarget !== null}
        onOpenChange={(o) => {
          if (!o) setRemoveTarget(null);
        }}
        title={labels.detailSectionAssignRemoveTitle}
        description={labels.detailSectionAssignRemoveConfirm}
        cancelLabel={labels.cancel}
        confirmLabel={labels.detailSectionAssignRemove}
        confirmVariant="destructive"
        busy={busy}
        onConfirm={() => {
          const target = removeTarget;
          setRemoveTarget(null);
          if (target) executeRemove(target);
        }}
      />
    </section>
  );
}
