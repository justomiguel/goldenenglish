"use client";

import Link from "next/link";
import { BookOpen, GraduationCap, Users } from "lucide-react";
import { revealFailureCode } from "@/lib/errors/revealFailureCode";
import { adminAcademicSectionHref } from "@/lib/dashboard/loadAdminStudentDirectoryExtras";
import type { StudentFichaCohortEnrollment } from "@/lib/dashboard/studentFichaCohort";
import type { Dictionary } from "@/types/i18n";
import { AdminUserNameLink } from "@/components/molecules/AdminUserNameLink";

type UserLabels = Dictionary["admin"]["users"];

export interface AdminStudentCohortHistoryListProps {
  locale: string;
  cohortId: string;
  rows: StudentFichaCohortEnrollment[];
  labels: UserLabels;
  listCode?: string | null;
}

function statusLabel(labels: UserLabels, status: string): string {
  const known: Record<string, string> = {
    active: labels.detailEnrollmentStatusActive,
    completed: labels.detailEnrollmentStatusCompleted,
    transferred: labels.detailEnrollmentStatusTransferred,
    dropped: labels.detailEnrollmentStatusDropped,
  };
  return known[status] ?? status;
}

export function AdminStudentCohortHistoryList({
  locale,
  cohortId,
  rows,
  labels,
  listCode = null,
}: AdminStudentCohortHistoryListProps) {
  if (listCode) {
    return (
      <p className="text-sm text-[var(--color-error)]">
        {revealFailureCode(labels.detailCohortListFailed, listCode)}
      </p>
    );
  }
  if (rows.length === 0) {
    return <p className="text-sm text-[var(--color-muted-foreground)]">{labels.detailCohortEmptySections}</p>;
  }
  return (
    <ul className="divide-y divide-[var(--color-border)] rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)]">
      {rows.map((row) => {
        const href = adminAcademicSectionHref(locale, { id: row.sectionId, cohortId });
        return (
          <li key={row.enrollmentId} className="space-y-1 px-3 py-3">
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              {href ? (
                <Link href={href} className="inline-flex items-center gap-1.5 font-medium text-[var(--color-primary)]">
                  <BookOpen className="h-4 w-4 shrink-0" aria-hidden />
                  {row.sectionName}
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1.5 font-medium text-[var(--color-foreground)]">
                  <BookOpen className="h-4 w-4 shrink-0" aria-hidden />
                  {row.sectionName}
                </span>
              )}
              <span className="text-[var(--color-muted-foreground)]">{statusLabel(labels, row.status)}</span>
            </p>
            <p className="flex flex-wrap items-center gap-1.5 text-sm text-[var(--color-foreground)]">
              <GraduationCap className="h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden />
              <span>{labels.detailSectionAssignTeacher}:</span>
              {row.teacher ? (
                <AdminUserNameLink locale={locale} userId={row.teacher.id} name={row.teacher.name} />
              ) : (
                <span>{labels.detailNoValue}</span>
              )}
            </p>
            {row.assistants.length > 0 ? (
              <p className="flex flex-wrap items-center gap-1.5 text-sm text-[var(--color-foreground)]">
                <Users className="h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden />
                <span>{labels.detailSectionAssignAssistants}:</span>
                {row.assistants.map((person) => (
                  <AdminUserNameLink key={person.id} locale={locale} userId={person.id} name={person.name} />
                ))}
              </p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
