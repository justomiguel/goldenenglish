import Link from "next/link";
import type { Dictionary } from "@/types/i18n";

export interface TeacherSectionCardProps {
  locale: string;
  sectionId: string;
  name: string;
  cohortName: string;
  scheduleSummary: string;
  activeStudentCount: number;
  /** When the viewer is an assistant (not `teacher_id`), show a small badge. */
  accessRole?: "lead" | "assistant";
  dict: Dictionary["dashboard"]["teacherMySections"];
}

export function TeacherSectionCard({
  locale,
  sectionId,
  name,
  cohortName,
  scheduleSummary,
  activeStudentCount,
  accessRole = "lead",
  dict,
}: TeacherSectionCardProps) {
  const baseHref = `/${locale}/dashboard/teacher/sections/${sectionId}`;
  const schedule = scheduleSummary || dict.scheduleEmpty;

  return (
    <article className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={baseHref}
          className="text-lg font-semibold text-[var(--color-foreground)] underline-offset-2 hover:text-[var(--color-primary)] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
        >
          {name}
        </Link>
        {accessRole === "assistant" ? (
          <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-muted)]/30 px-2 py-0.5 text-xs font-medium text-[var(--color-muted-foreground)]">
            {dict.assistantBadge}
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{cohortName}</p>
      <p className="mt-2 text-sm text-[var(--color-foreground)]">{schedule}</p>
      <p className="mt-3 text-sm font-medium text-[var(--color-primary)]">
        {dict.studentsCountLabel.replace("{count}", String(activeStudentCount))}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={baseHref}
          className="inline-flex min-h-[44px] items-center rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm font-medium text-[var(--color-primary)] hover:bg-[var(--color-muted)]"
        >
          {dict.openRoster}
        </Link>
        <Link
          href={`${baseHref}/attendance`}
          className="inline-flex min-h-[44px] items-center rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm font-medium text-[var(--color-primary)] hover:bg-[var(--color-muted)]"
        >
          {dict.openAttendance}
        </Link>
        <Link
          href={`${baseHref}/assessments`}
          className="inline-flex min-h-[44px] items-center rounded-[var(--layout-border-radius)] bg-[var(--color-primary)] px-3 text-sm font-semibold text-[var(--color-primary-foreground)]"
        >
          {dict.openAssessments}
        </Link>
      </div>
    </article>
  );
}
