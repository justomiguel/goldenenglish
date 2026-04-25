"use client";

import type { Dictionary } from "@/types/i18n";
import type { AdminStudentCurrentCohortEnrollment } from "@/lib/dashboard/loadAdminStudentCurrentCohortAssignment";

type UserLabels = Dictionary["admin"]["users"];

export interface AdminStudentSectionsListProps {
  sections: AdminStudentCurrentCohortEnrollment[];
  labels: UserLabels;
  busy: boolean;
  onRemove: (enrollment: AdminStudentCurrentCohortEnrollment) => void;
}

export function AdminStudentSectionsList({
  sections,
  labels,
  busy,
  onRemove,
}: AdminStudentSectionsListProps) {
  return (
    <div className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
        {labels.detailSectionAssignCurrent}
      </p>
      {sections.length === 0 ? (
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          {labels.detailSectionAssignCurrentNone}
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-[var(--color-border)]">
          {sections.map((cs) => (
            <li key={cs.enrollmentId} className="flex items-center justify-between gap-2 py-2">
              <span className="text-sm font-semibold text-[var(--color-foreground)]">
                {cs.sectionName}
              </span>
              <button
                type="button"
                disabled={busy}
                onClick={() => onRemove(cs)}
                aria-label={`${labels.detailSectionAssignRemove} ${cs.sectionName}`}
                className="rounded-[var(--layout-border-radius)] border border-[var(--color-error)]/30 px-2.5 py-1 text-xs font-medium text-[var(--color-error)] transition-colors hover:bg-[var(--color-error)]/10 disabled:opacity-50"
              >
                {labels.detailSectionAssignRemove}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
