import { HeartPulse } from "lucide-react";

/**
 * Marks a student as needing special care, and says nothing about what kind.
 * It appears in rosters and attendance grids, where the viewer may not be
 * entitled to the detail; the detail lives behind `loadStudentCareNotes`.
 */
export function StudentCareBadge({ label }: { label: string }) {
  return (
    <span
      className="inline-flex shrink-0 rounded-full border border-[var(--color-secondary)] p-0.5 text-[var(--color-secondary)]"
      title={label}
      aria-label={label}
    >
      <HeartPulse className="h-3.5 w-3.5" aria-hidden />
    </span>
  );
}
