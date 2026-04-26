import type { Dictionary } from "@/types/i18n";
import type { AdminSectionHealthSnapshot } from "@/types/adminSectionHealth";
import type { HealthChartSlice } from "@/components/molecules/AcademicSectionHealthCharts";
import { AcademicSectionHealthCharts } from "@/components/molecules/AcademicSectionHealthCharts";
import { AcademicSectionHealthSummaryStrip } from "@/components/molecules/AcademicSectionHealthSummaryStrip";

export interface AcademicSectionHealthOverviewProps {
  locale: string;
  snapshot: AdminSectionHealthSnapshot;
  dict: Dictionary["dashboard"]["academicSectionPage"]["health"];
}

export function AcademicSectionHealthOverview({ locale, snapshot, dict }: AcademicSectionHealthOverviewProps) {
  const { attendance, tasks, payments, engagement, assessments, learningRoute } = snapshot;
  const h = learningRoute.health;

  const attendanceChart: HealthChartSlice[] = [
    { key: "p", name: dict.segPresent, value: attendance.present, fill: "var(--color-success)" },
    { key: "a", name: dict.segAbsent, value: attendance.absent, fill: "var(--color-error)" },
    { key: "l", name: dict.segLate, value: attendance.late, fill: "var(--color-accent)" },
    { key: "e", name: dict.segExcused, value: attendance.excused, fill: "var(--color-muted-foreground)" },
  ].filter((r) => r.value > 0);

  const taskChart: HealthChartSlice[] = [
    { key: "n", name: dict.segNotOpened, value: tasks.notOpened, fill: "var(--color-muted-foreground)" },
    { key: "o", name: dict.segOpened, value: tasks.opened, fill: "var(--color-primary)" },
    { key: "c", name: dict.segCompleted, value: tasks.completed, fill: "var(--color-success)" },
  ].filter((r) => r.value > 0);

  const used = snapshot.activeStudents;
  const free = Math.max(0, snapshot.effectiveMaxStudents - used);
  const capacityChart: HealthChartSlice[] | null =
    snapshot.effectiveMaxStudents > 0
      ? [
          { key: "u", name: dict.segCapacityUsed, value: used, fill: "var(--color-primary)" },
          { key: "f", name: dict.segCapacityFree, value: free, fill: "var(--color-muted)" },
        ]
      : null;

  const paymentChart: HealthChartSlice[] = [
    {
      key: "d",
      name: dict.segPaymentsDebt,
      value: payments.activeWithDebt,
      fill: "var(--color-error)",
    },
    {
      key: "c",
      name: dict.segPaymentsClear,
      value: payments.activeWithoutDebt,
      fill: "var(--color-success)",
    },
  ];

  const engagementBars = [
    { key: "pt", name: dict.chartEngagementPoints, value: engagement.sumEngagementPoints },
    { key: "mv", name: dict.chartEngagementMaterial, value: engagement.materialViews30d },
    { key: "le", name: dict.chartEngagementLearning, value: engagement.learningEvents30d },
  ];

  const pending = Math.max(0, assessments.expectedSlots - assessments.publishedGradeRows);
  const assessmentChart: HealthChartSlice[] = [
    {
      key: "pub",
      name: dict.segAssessmentsPublished,
      value: assessments.publishedGradeRows,
      fill: "var(--color-success)",
    },
    { key: "pen", name: dict.segAssessmentsPending, value: pending, fill: "var(--color-muted-foreground)" },
  ];

  const readinessChart: HealthChartSlice[] = [
    {
      key: "ns",
      name: dict.segReadinessSupport,
      value: h.needsSupportCount,
      fill: "var(--color-warning)",
    },
    {
      key: "to",
      name: dict.segReadinessOverride,
      value: h.teacherOverrideCount,
      fill: "var(--color-accent)",
    },
  ];

  const flags: string[] = [];
  if (h.missingEntryAssessment) flags.push(dict.flagMissingEntry);
  if (h.missingExitAssessment) flags.push(dict.flagMissingExit);
  if (learningRoute.mode === "route" && h.missingObjectives) flags.push(dict.flagMissingObjectives);

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h2 className="text-base font-semibold text-[var(--color-primary)]">{dict.title}</h2>
        <p className="text-sm text-[var(--color-muted-foreground)]">{dict.lead}</p>
        <p className="text-xs text-[var(--color-muted-foreground)]">{dict.windowHint}</p>
      </header>

      <AcademicSectionHealthSummaryStrip locale={locale} snapshot={snapshot} dict={dict} />

      {learningRoute.routeTitle && learningRoute.mode === "route" ? (
        <p className="text-sm text-[var(--color-foreground)]">
          <span className="font-medium text-[var(--color-primary)]">{learningRoute.routeTitle}</span>
        </p>
      ) : null}

      {flags.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {flags.map((t) => (
            <li
              key={t}
              className="rounded-full border border-[var(--color-warning)]/50 bg-[var(--color-warning)]/10 px-2.5 py-1 text-xs font-medium text-[var(--color-warning)]"
            >
              {t}
            </li>
          ))}
        </ul>
      ) : null}

      <AcademicSectionHealthCharts
        locale={locale}
        dict={dict}
        attendance={attendanceChart}
        tasks={taskChart}
        capacity={capacityChart}
        payments={paymentChart}
        engagement={engagementBars}
        assessments={assessmentChart}
        readiness={readinessChart}
      />
    </div>
  );
}
