"use client";

import Link from "next/link";
import { BookOpen, GraduationCap, Users } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import type {
  AdminStudentCurrentCohortEnrollment,
  AdminStudentCurrentCohortSectionOption,
  AdminStudentSectionStaff,
} from "@/lib/dashboard/loadAdminStudentCurrentCohortAssignment";
import { adminAcademicSectionHref } from "@/lib/dashboard/loadAdminStudentDirectoryExtras";
import { AdminUserNameLink } from "@/components/molecules/AdminUserNameLink";

type UserLabels = Dictionary["admin"]["users"];

export interface AdminStudentSectionsListProps {
  locale: string;
  cohortId: string | null;
  sections: AdminStudentCurrentCohortEnrollment[];
  sectionOptions: AdminStudentCurrentCohortSectionOption[];
  labels: UserLabels;
  busy: boolean;
  onRemove: (enrollment: AdminStudentCurrentCohortEnrollment) => void;
}

function named(value: string | null | undefined): string | null {
  const text = value?.trim() ?? "";
  if (!text || text === "—") return null;
  return text;
}

function teacherForSection(
  enrollment: AdminStudentCurrentCohortEnrollment,
  sectionOptions: AdminStudentCurrentCohortSectionOption[],
): AdminStudentSectionStaff | null {
  const fromEnrollment = named(enrollment.teacher?.name);
  if (enrollment.teacher && fromEnrollment) {
    return { id: enrollment.teacher.id, name: fromEnrollment };
  }
  const option = sectionOptions.find((section) => section.id === enrollment.sectionId);
  const fromOption = named(option?.teacherName);
  if (!option?.teacherId || !fromOption) return null;
  return { id: option.teacherId, name: fromOption };
}

function StaffNames({
  locale,
  people,
}: {
  locale: string;
  people: AdminStudentSectionStaff[];
}) {
  return (
    <>
      {people.map((person, index) => (
        <span key={person.id}>
          {index > 0 ? ", " : null}
          <AdminUserNameLink locale={locale} userId={person.id} name={person.name} />
        </span>
      ))}
    </>
  );
}

export function AdminStudentSectionsList({
  locale,
  cohortId,
  sections,
  sectionOptions,
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
          {sections.map((cs) => {
            const href = adminAcademicSectionHref(locale, {
              id: cs.sectionId,
              cohortId,
            });
            const teacher = teacherForSection(cs, sectionOptions);
            const assistants = (cs.assistants ?? []).filter((person) => named(person.name));
            return (
              <li key={cs.enrollmentId} className="flex items-start justify-between gap-2 py-2">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                    <span className="inline-flex min-w-0 items-center gap-1.5">
                      <BookOpen
                        className="h-4 w-4 shrink-0 text-[var(--color-primary)]"
                        aria-hidden
                      />
                      <span className="sr-only">{labels.detailSectionAssignSection}</span>
                      {href ? (
                        <Link
                          href={href}
                          title={labels.tipOpenAcademicSection}
                          className="font-semibold text-[var(--color-primary)] underline-offset-2 hover:underline"
                        >
                          {cs.sectionName}
                        </Link>
                      ) : (
                        <span className="font-semibold text-[var(--color-foreground)]">
                          {cs.sectionName}
                        </span>
                      )}
                    </span>
                    {teacher ? (
                      <span className="inline-flex min-w-0 items-center gap-1.5">
                        <GraduationCap
                          className="h-4 w-4 shrink-0 text-[var(--color-foreground)]"
                          aria-hidden
                        />
                        <span className="sr-only">{labels.detailSectionAssignTeacher}</span>
                        <AdminUserNameLink locale={locale} userId={teacher.id} name={teacher.name} />
                      </span>
                    ) : null}
                  </p>
                  {assistants.length > 0 ? (
                    <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-[var(--color-foreground)]">
                      <Users
                        className="h-4 w-4 shrink-0 text-[var(--color-foreground)]"
                        aria-hidden
                      />
                      <span className="sr-only">{labels.detailSectionAssignAssistants}</span>
                      <StaffNames locale={locale} people={assistants} />
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onRemove(cs)}
                  aria-label={`${labels.detailSectionAssignRemove} ${cs.sectionName}`}
                  className="shrink-0 rounded-[var(--layout-border-radius)] border border-[var(--color-error)]/30 px-2.5 py-1 text-xs font-medium text-[var(--color-error)] transition-colors hover:bg-[var(--color-error)]/10 disabled:opacity-50"
                >
                  {labels.detailSectionAssignRemove}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
