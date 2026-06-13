import Link from "next/link";
import { formatProfileNameSurnameFirst } from "@/lib/profile/formatProfileDisplayName";

export interface ParentChildSwitcherProps {
  locale: string;
  summaries: { studentId: string; firstName: string; lastName: string }[];
  selectedStudentId?: string;
  ariaLabel: string;
  /** Dashboard base path (defaults to parent home). */
  dashboardBase?: string;
}

export function ParentChildSwitcher({
  locale,
  summaries,
  selectedStudentId,
  ariaLabel,
  dashboardBase,
}: ParentChildSwitcherProps) {
  if (summaries.length <= 1) return null;

  const base = dashboardBase ?? `/${locale}/dashboard/parent`;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1" role="navigation" aria-label={ariaLabel}>
      {summaries.map((child) => {
        const active = child.studentId === selectedStudentId;
        return (
          <Link
            key={child.studentId}
            href={`${base}?child=${encodeURIComponent(child.studentId)}`}
            className={
              active
                ? "shrink-0 rounded-full bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-[var(--color-primary-foreground)]"
                : "shrink-0 rounded-full border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-2.5 text-sm font-medium text-[var(--color-foreground)]"
            }
          >
            {formatProfileNameSurnameFirst(child.firstName, child.lastName)}
          </Link>
        );
      })}
    </div>
  );
}
