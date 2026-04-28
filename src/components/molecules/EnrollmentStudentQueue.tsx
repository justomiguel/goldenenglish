"use client";

import type { AdminStudentSearchHitLike } from "@/components/molecules/AdminStudentSearchCombobox";
import { EnrollmentInlineStudentChip } from "@/components/molecules/EnrollmentInlineStudentChip";

export interface EnrollmentStudentQueueProps {
  legend: string;
  reminder: string;
  removeAria: string;
  items: AdminStudentSearchHitLike[];
  onRemove: (id: string) => void;
  disabled?: boolean;
}

export function EnrollmentStudentQueue({
  legend,
  reminder,
  removeAria,
  items,
  onRemove,
  disabled,
}: EnrollmentStudentQueueProps) {
  if (items.length === 0) return null;
  const headingId = "enrollment-student-queue-heading";
  return (
    <div
      className="rounded-[var(--layout-border-radius)] border-2 border-[var(--color-primary)]/50 bg-[var(--color-primary)]/6 p-3 shadow-[var(--shadow-card)]"
      role="region"
      aria-labelledby={headingId}
    >
      <p id={headingId} className="text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">
        {legend}
      </p>
      <p className="mt-1.5 text-sm font-medium text-[var(--color-foreground)]">{reminder}</p>
      <ul className="mt-3 flex flex-wrap gap-2" role="list">
        {items.map((s) => (
          <li key={s.id} className="list-none">
            <EnrollmentInlineStudentChip
              label={s.label}
              dismissAriaLabel={removeAria}
              disabled={disabled}
              onDismiss={() => onRemove(s.id)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
