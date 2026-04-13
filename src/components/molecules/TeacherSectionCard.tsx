import Link from "next/link";
import type { Dictionary } from "@/types/i18n";

export interface TeacherSectionCardProps {
  locale: string;
  sectionId: string;
  name: string;
  cohortName: string;
  scheduleSummary: string;
  activeStudentCount: number;
  dict: Dictionary["dashboard"]["teacherMySections"];
}

export function TeacherSectionCard({
  locale,
  sectionId,
  name,
  cohortName,
  scheduleSummary,
  activeStudentCount,
  dict,
}: TeacherSectionCardProps) {
  const href = `/${locale}/dashboard/teacher/sections/${sectionId}`;
  const schedule = scheduleSummary || dict.scheduleEmpty;

  return (
    <Link
      href={href}
      className="block min-h-[44px] rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)] transition-colors hover:border-[var(--color-primary)]/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
    >
      <p className="text-lg font-semibold text-[var(--color-foreground)]">{name}</p>
      <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{cohortName}</p>
      <p className="mt-2 text-sm text-[var(--color-foreground)]">{schedule}</p>
      <p className="mt-3 text-sm font-medium text-[var(--color-primary)]">
        {dict.studentsCountLabel.replace("{count}", String(activeStudentCount))}
      </p>
    </Link>
  );
}
