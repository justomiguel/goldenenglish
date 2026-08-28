import { AcademicCohortLifecycleBar } from "@/components/organisms/AcademicCohortLifecycleBar";
import { AcademicCohortFeeDefaultsEditor } from "@/components/organisms/AcademicCohortFeeDefaultsEditor";
import type { Dictionary } from "@/types/i18n";

type CohortPageDict = Dictionary["dashboard"]["academicCohortPage"];

export function AcademicCohortOverviewTab(props: {
  locale: string;
  cohortId: string;
  cohortArchivedAt: string | null;
  isCurrent: boolean;
  distinctActiveStudents: number;
  sectionCount: number;
  initialEnrollment: number | null;
  initialMonthly: number | null;
  initialMode?: "per_section" | "once_for_all";
  canUseOnceForAll?: boolean;
  dict: CohortPageDict;
}) {
  const { dict: d } = props;
  return (
    <div className="space-y-4">
      <AcademicCohortLifecycleBar
        locale={props.locale}
        cohortId={props.cohortId}
        cohortArchivedAt={props.cohortArchivedAt}
        isCurrent={props.isCurrent}
        dict={d.lifecycle}
      />
      <section className="grid gap-4 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/10 p-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
            {d.kpiStudents}
          </p>
          <p className="mt-1 text-2xl font-semibold text-[var(--color-foreground)]">
            {props.distinctActiveStudents}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
            {d.kpiSections}
          </p>
          <p className="mt-1 text-2xl font-semibold text-[var(--color-foreground)]">
            {props.sectionCount}
          </p>
        </div>
      </section>
      <AcademicCohortFeeDefaultsEditor
        locale={props.locale}
        cohortId={props.cohortId}
        archived={props.cohortArchivedAt != null}
        initialEnrollment={props.initialEnrollment}
        initialMonthly={props.initialMonthly}
        initialMode={props.initialMode}
        canUseOnceForAll={props.canUseOnceForAll}
        dict={d.feeDefaults}
      />
    </div>
  );
}
