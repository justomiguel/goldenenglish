import type { Dictionary } from "@/types/i18n";
import type { AdminSectionHealthSnapshot } from "@/types/adminSectionHealth";

export interface AcademicSectionHealthKpiGridProps {
  locale: string;
  snapshot: AdminSectionHealthSnapshot;
  dict: Dictionary["dashboard"]["academicSectionPage"]["health"];
}

function fmtPct(locale: string, v: number | null, na: string) {
  if (v == null) return na;
  return new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 }).format(v / 100);
}

function fmtInt(locale: string, n: number) {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(n);
}

function KpiCard({
  label,
  value,
  foot,
}: {
  label: string;
  value: string;
  foot?: string;
}) {
  return (
    <div className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--color-foreground)]">{value}</p>
      {foot ? <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{foot}</p> : null}
    </div>
  );
}

export function AcademicSectionHealthKpiGrid({ locale, snapshot, dict }: AcademicSectionHealthKpiGridProps) {
  const { na } = dict;
  const cap = fmtPct(locale, snapshot.capacityUtilizationPct, na);
  const att = fmtPct(locale, snapshot.attendance.ratePct, na);
  const tasksOpen = fmtPct(locale, snapshot.tasks.openOrDonePct, na);
  const tasksDone = fmtPct(locale, snapshot.tasks.completedPct, na);
  const assess = snapshot.assessments.coveragePct;
  const assessLabel =
    assess == null
      ? na
      : `${fmtInt(locale, snapshot.assessments.publishedGradeRows)} / ${fmtInt(locale, snapshot.assessments.expectedSlots)} (${fmtPct(locale, assess, na)})`;

  const routeLabel =
    snapshot.learningRoute.mode === "free_flow"
      ? dict.kpiRouteFree
      : snapshot.learningRoute.mode === "route"
        ? dict.kpiRouteBound
        : na;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      <KpiCard label={dict.kpiStudents} value={fmtInt(locale, snapshot.activeStudents)} />
      <KpiCard label={dict.kpiCapacity} value={cap} foot={`${fmtInt(locale, snapshot.activeStudents)} / ${fmtInt(locale, snapshot.effectiveMaxStudents)}`} />
      <KpiCard label={dict.kpiAttendance} value={att} foot={dict.kpiAttendanceFoot} />
      <KpiCard label={dict.kpiTasksOpened} value={tasksOpen} foot={dict.kpiTasksFoot} />
      <KpiCard label={dict.kpiTasksCompleted} value={tasksDone} />
      <KpiCard
        label={dict.kpiDebt}
        value={fmtInt(locale, snapshot.payments.activeWithDebt)}
        foot={`${dict.kpiNoDebt}: ${fmtInt(locale, snapshot.payments.activeWithoutDebt)}`}
      />
      <KpiCard label={dict.kpiEngagementPoints} value={fmtInt(locale, snapshot.engagement.sumEngagementPoints)} />
      <KpiCard label={dict.kpiMaterialViews} value={fmtInt(locale, snapshot.engagement.materialViews30d)} />
      <KpiCard label={dict.kpiLearningEvents} value={fmtInt(locale, snapshot.engagement.learningEvents30d)} />
      <KpiCard label={dict.kpiAssessments} value={assessLabel} />
      <KpiCard
        label={dict.kpiRouteMode}
        value={routeLabel}
        foot={
          snapshot.learningRoute.mode === "route" && snapshot.learningRoute.plannedSteps > 0
            ? `${dict.kpiPlannedSteps}: ${fmtInt(locale, snapshot.learningRoute.plannedSteps)}`
            : undefined
        }
      />
      <KpiCard label={dict.kpiNeedsSupport} value={fmtInt(locale, snapshot.learningRoute.health.needsSupportCount)} />
      <KpiCard
        label={dict.kpiTeacherOverride}
        value={fmtInt(locale, snapshot.learningRoute.health.teacherOverrideCount)}
      />
    </div>
  );
}
