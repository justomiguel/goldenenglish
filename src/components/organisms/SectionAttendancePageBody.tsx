import Link from "next/link";
import { ArrowLeft, ListChecks } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import type { PreparedTeacherSectionAttendancePage } from "@/lib/academics/prepareTeacherSectionAttendancePage";
import { SectionAttendanceMatrix } from "@/components/organisms/SectionAttendanceMatrix";
import {
  TeacherAttendanceScopeLinks,
  type TeacherAttendanceScope,
} from "@/components/molecules/TeacherAttendanceScopeLinks";

export interface SectionAttendancePageBodyProps {
  locale: string;
  sectionId: string;
  scope: TeacherAttendanceScope;
  sectionName: string;
  prep: PreparedTeacherSectionAttendancePage;
  dict: Dictionary["dashboard"]["teacherSectionAttendance"];
  backHref: string;
  backLabel: string;
  buildScopeHref: (s: TeacherAttendanceScope) => string;
}

export function SectionAttendancePageBody({
  locale,
  sectionId,
  scope,
  sectionName,
  prep,
  dict: d,
  backHref,
  backLabel,
  buildScopeHref,
}: SectionAttendancePageBodyProps) {
  const fullCourseHref = buildScopeHref("full");
  const scheduleLineNode = prep.scheduleLine ? (
    <p className="text-xs text-[var(--color-muted-foreground)]">{prep.scheduleLine}</p>
  ) : null;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={backHref}
          className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-[var(--color-primary)] hover:underline"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          {backLabel}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-[var(--color-foreground)]">{d.title}</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{sectionName}</p>
      </div>

      {prep.canShowMatrixShell ? (
        <TeacherAttendanceScopeLinks
          locale={locale}
          sectionId={sectionId}
          active={scope}
          dict={d.scopeLinks}
          buildScopeHref={buildScopeHref}
        />
      ) : null}

      {!prep.dateWindowOk || !prep.hasScheduleSlots || !prep.canShowMatrixShell ? (
        <>
          {scheduleLineNode}
          <p role="status" className="text-sm text-[var(--color-muted-foreground)]">
            {prep.hasScheduleSlots ? d.noEligibleClassDates : d.noScheduleSlots}
          </p>
        </>
      ) : scope === "operational" && !prep.hasEligibleOperational && prep.hasEligibleFull ? (
        <>
          {scheduleLineNode}
          <div
            role="status"
            className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/40 p-4 text-sm text-[var(--color-foreground)]"
          >
            <p>{d.scopeLinks.operationalOnlyEmptyLead}</p>
            <Link
              href={fullCourseHref}
              className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-[var(--layout-border-radius)] border border-[var(--color-primary)] bg-[var(--color-primary)]/10 px-3 py-2 text-sm font-semibold text-[var(--color-primary)] hover:bg-[var(--color-primary)]/15"
            >
              <ListChecks className="h-4 w-4 shrink-0" aria-hidden />
              {d.scopeLinks.fullCourse}
            </Link>
          </div>
        </>
      ) : !prep.hasEligibleForScope ? (
        <>
          {scheduleLineNode}
          <p role="status" className="text-sm text-[var(--color-muted-foreground)]">
            {d.noEligibleClassDates}
          </p>
        </>
      ) : (
        <>
          {scheduleLineNode}
          <p className="text-xs text-[var(--color-muted-foreground)]">
            {scope === "full" ? d.scopeLinks.matrixContextFull : d.scopeLinks.matrixContextOperational}
          </p>
          <p className="text-xs text-[var(--color-muted-foreground)]">{d.dateMinHint}</p>
          {prep.matrix ? (
            <SectionAttendanceMatrix
              variant="teacher"
              locale={locale}
              sectionId={sectionId}
              todayIso={prep.todayIso}
              initialPayloadJson={JSON.stringify(prep.matrix)}
              editableByDateJson={JSON.stringify(prep.editableByDate)}
              scheduleLine={prep.scheduleLine}
              matrixDict={d.matrix}
              offlineHint={d.offlineHint}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
