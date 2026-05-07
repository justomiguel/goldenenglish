import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { formatAcademicScheduleSummary } from "@/lib/academics/formatAcademicScheduleSummary";

export interface StaffAssistantSectionCardProps {
  locale: string;
  sectionId: string;
  name: string;
  cohortName: string;
  scheduleSlots: unknown;
  activeStudentCount: number;
  accessRole: "lead" | "assistant";
  sectionsDict: Dictionary["dashboard"]["teacherMySections"];
  attendanceCta: string;
}

export function StaffAssistantSectionCard({
  locale,
  sectionId,
  name,
  cohortName,
  scheduleSlots,
  activeStudentCount,
  accessRole,
  sectionsDict,
  attendanceCta,
}: StaffAssistantSectionCardProps) {
  const attendanceHref = `/${locale}/dashboard/assistant/sections/${sectionId}/attendance`;
  const scheduleSummary = formatAcademicScheduleSummary(scheduleSlots, locale);
  const schedule = scheduleSummary || sectionsDict.scheduleEmpty;

  return (
    <article className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold text-[var(--color-foreground)]">{name}</h2>
        {accessRole === "assistant" ? (
          <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-muted)]/30 px-2 py-0.5 text-xs font-medium text-[var(--color-muted-foreground)]">
            {sectionsDict.assistantBadge}
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{cohortName}</p>
      <p className="mt-2 text-sm text-[var(--color-foreground)]">{schedule}</p>
      <p className="mt-3 text-sm font-medium text-[var(--color-primary)]">
        {sectionsDict.studentsCountLabel.replace("{count}", String(activeStudentCount))}
      </p>
      <div className="mt-4">
        <Link
          href={attendanceHref}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-[var(--layout-border-radius)] bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary-foreground)] shadow-sm transition hover:opacity-95"
        >
          <ClipboardCheck className="h-4 w-4 shrink-0" aria-hidden />
          {attendanceCta}
        </Link>
      </div>
    </article>
  );
}
