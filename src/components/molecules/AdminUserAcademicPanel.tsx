"use client";

import type { ReactNode } from "react";
import { revealFailureCode } from "@/lib/errors/revealFailureCode";
import {
  buildStudentCohortOptions,
  defaultStudentCohortId,
} from "@/lib/dashboard/studentFichaCohort";
import type { AdminUserDetailVM } from "@/lib/dashboard/adminUserDetailVM";
import type { AcademicProfileCardField } from "@/lib/academic-profile/academicProfileCard";
import type { Dictionary, Locale } from "@/types/i18n";
import { AdminAcademicProfileFields } from "@/components/molecules/AdminAcademicProfileFields";
import { AdminStudentAcademicExams } from "@/components/molecules/AdminStudentAcademicExams";
import { AdminStudentAcademicNotes } from "@/components/molecules/AdminStudentAcademicNotes";
import { AdminStudentCohortHistoryList } from "@/components/molecules/AdminStudentCohortHistoryList";
import { AdminStudentCohortSelect } from "@/components/molecules/AdminStudentCohortSelect";
import { AdminStudentCurrentCohortAssignmentCard } from "@/components/molecules/AdminStudentCurrentCohortAssignmentCard";
import { AdminUserInlineEditableField } from "@/components/molecules/AdminUserInlineEditableField";

type UserLabels = Dictionary["admin"]["users"];
type RoleOption = { value: string; label: string };

function CardShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-3.5 shadow-[var(--shadow-soft)] sm:p-5">
      <h2 className="border-b border-[var(--color-border)] pb-2.5 font-display text-base font-semibold text-[var(--color-primary)] sm:pb-3 sm:text-lg">
        {title}
      </h2>
      <dl className="mt-3 sm:mt-4">{children}</dl>
    </section>
  );
}

export function AdminUserAcademicPanel({
  locale,
  detail,
  labels,
  editable,
  roleLabel,
  roleOptions,
  onFeedback,
  academicFields = [],
  selectedCohortId = null,
  onCohortChange,
}: {
  locale: Locale;
  detail: AdminUserDetailVM;
  labels: UserLabels;
  editable: boolean;
  roleLabel: string;
  roleOptions: RoleOption[];
  onFeedback: (text: string, ok: boolean) => void;
  academicFields?: AcademicProfileCardField[];
  selectedCohortId?: string | null;
  onCohortChange?: (cohortId: string) => void;
}) {
  const currentCohortAssignment = detail.role === "student" ? detail.currentCohortAssignment : null;
  const options = buildStudentCohortOptions(detail.cohortEnrollments ?? []);
  const selected =
    selectedCohortId && options.some((option) => option.id === selectedCohortId)
      ? selectedCohortId
      : defaultStudentCohortId(options);
  const showEditor = Boolean(
    currentCohortAssignment?.cohortId &&
      (selected == null || selected === currentCohortAssignment.cohortId),
  );
  const historyRows = (detail.cohortEnrollments ?? []).filter((row) => row.cohortId === selected);

  return (
    <div className="space-y-5">
      {detail.role === "student" && options.length > 0 && onCohortChange && selected ? (
        <AdminStudentCohortSelect
          id="academic-cohort-select"
          label={labels.detailCohortSelect}
          currentMark={labels.detailCohortCurrentMark}
          options={options}
          value={selected}
          onChange={onCohortChange}
        />
      ) : null}
      {detail.cohortListCode ? (
        <p className="text-sm text-[var(--color-error)]">
          {revealFailureCode(labels.detailCohortListFailed, detail.cohortListCode)}
        </p>
      ) : null}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(20rem,1.05fr)]">
        <CardShell title={labels.detailCardAcademic}>
          <AdminUserInlineEditableField locale={locale} userId={detail.userId} field="role" label={labels.detailFieldRole} displayValue={roleLabel} editInitial={detail.role} editable={editable} inputKind="select" selectOptions={roleOptions} labels={labels} onFeedback={onFeedback} />
          {detail.role === "student" ? (
            <AdminAcademicProfileFields
              locale={locale}
              studentId={detail.userId}
              editable={editable}
              fields={academicFields}
              labels={labels.academicFields}
            />
          ) : null}
        </CardShell>
        {showEditor && currentCohortAssignment ? (
          <AdminStudentCurrentCohortAssignmentCard
            locale={locale}
            studentId={detail.userId}
            labels={labels}
            assignment={currentCohortAssignment}
          />
        ) : detail.role === "student" && selected ? (
          <AdminStudentCohortHistoryList
            locale={locale}
            cohortId={selected}
            rows={historyRows}
            labels={labels}
          />
        ) : null}
      </div>
      {detail.role === "student" ? (
        <>
          <AdminStudentAcademicExams locale={locale} exams={detail.academicExams ?? []} labels={labels} />
          <AdminStudentAcademicNotes locale={locale} notes={detail.academicNotes ?? []} labels={labels} />
        </>
      ) : null}
    </div>
  );
}
