import Link from "next/link";
import { formatProfileNameSurnameFirst } from "@/lib/profile/formatProfileDisplayName";

export interface ParentChildSwitcherProps {
  locale: string;
  summaries: { studentId: string; firstName: string; lastName: string }[];
  selectedStudentId?: string;
  ariaLabel: string;
}

export function ParentChildSwitcher({
  locale,
  summaries,
  selectedStudentId,
  ariaLabel,
}: ParentChildSwitcherProps) {
  if (summaries.length <= 1) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1" role="navigation" aria-label={ariaLabel}>
      {summaries.map((child) => {
        const active = child.studentId === selectedStudentId;
        return (
          <Link
            key={child.studentId}
            href={`/${locale}/dashboard/parent?child=${encodeURIComponent(child.studentId)}`}
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
