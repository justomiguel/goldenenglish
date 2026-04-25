"use client";

import type { Dictionary } from "@/types/i18n";
import type { AdminStudentCurrentCohortAssignment } from "@/lib/dashboard/loadAdminStudentCurrentCohortAssignment";
import { Button } from "@/components/atoms/Button";

type UserLabels = Dictionary["admin"]["users"];

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

export interface AdminStudentAddSectionFormProps {
  availableSections: AdminStudentCurrentCohortAssignment["sections"];
  labels: UserLabels;
  selectedSectionId: string;
  capacityOverride: boolean;
  busy: boolean;
  parentWarning: boolean;
  onSelectChange: (id: string) => void;
  onCapacityChange: (v: boolean) => void;
  onPreview: () => void;
  onAdd: () => void;
}

export function AdminStudentAddSectionForm({
  availableSections,
  labels,
  selectedSectionId,
  capacityOverride,
  busy,
  parentWarning,
  onSelectChange,
  onCapacityChange,
  onPreview,
  onAdd,
}: AdminStudentAddSectionFormProps) {
  const hasAvailableSections = availableSections.length > 0;

  return (
    <>
      <div>
        <label className="block text-sm font-medium" htmlFor="student-add-section">
          {labels.detailSectionAssignSelect}
        </label>
        <select
          id="student-add-section"
          title={labels.detailSectionAssignSelectTitle}
          value={selectedSectionId}
          onChange={(e) => onSelectChange(e.target.value)}
          disabled={busy || !hasAvailableSections}
          className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm shadow-sm"
        >
          <option value="" disabled>
            {hasAvailableSections ? "—" : labels.detailSectionAssignNoAvailableSections}
          </option>
          {availableSections.map((section) => (
            <option key={section.id} value={section.id}>
              {sectionOptionLabel(labels, section)}
            </option>
          ))}
        </select>
        {!hasAvailableSections ? (
          <p className="mt-2 text-xs text-[var(--color-muted-foreground)]">
            {labels.detailSectionAssignNoAvailableSections}
          </p>
        ) : null}
      </div>
      <label className="flex items-start gap-2 rounded-[var(--layout-border-radius)] bg-[var(--color-muted)]/40 p-3 text-sm">
        <input
          type="checkbox"
          checked={capacityOverride}
          onChange={(e) => onCapacityChange(e.target.checked)}
          disabled={busy || !hasAvailableSections}
          className="mt-1"
        />
        {labels.detailSectionAssignCapacityOverride}
      </label>
      {parentWarning && (
        <p className="text-sm font-medium text-[var(--color-error)]">
          {labels.detailSectionAssignParentPending}
        </p>
      )}
      <div className="grid gap-2 sm:grid-cols-2">
        <Button
          type="button"
          variant="ghost"
          disabled={busy || !selectedSectionId || !hasAvailableSections}
          onClick={onPreview}
          className="min-h-[44px]"
        >
          {labels.detailSectionAssignPreview}
        </Button>
        <Button
          type="button"
          isLoading={busy}
          disabled={busy || !selectedSectionId || !hasAvailableSections}
          onClick={onAdd}
          className="min-h-[44px]"
        >
          {labels.detailSectionAssignSubmit}
        </Button>
      </div>
    </>
  );
}
