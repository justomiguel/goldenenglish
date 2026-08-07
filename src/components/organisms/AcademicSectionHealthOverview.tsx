import type { Dictionary } from "@/types/i18n";
import type { AdminSectionHealthSnapshot } from "@/types/adminSectionHealth";
import type { HealthChartSlice } from "@/components/molecules/AcademicSectionHealthCharts";
import { AcademicSectionHealthCharts } from "@/components/molecules/AcademicSectionHealthCharts";
import { AcademicSectionHealthSummaryStrip } from "@/components/molecules/AcademicSectionHealthSummaryStrip";
import type { AcademicSectionFeatureFlags } from "@/lib/academics/visibleAcademicSectionShellTabs";

export interface AcademicSectionHealthOverviewProps {
  locale: string;
  snapshot: AdminSectionHealthSnapshot;
  dict: Dictionary["dashboard"]["academicSectionPage"]["health"];
  featureFlags?: AcademicSectionFeatureFlags;
}

export function AcademicSectionHealthOverview({
  locale,
  snapshot,
  dict,
  featureFlags = { requiresEvaluationsToPass: false, usesLearningRoute: false },
}: AcademicSectionHealthOverviewProps) {
  const { attendance, payments, learningRoute } = snapshot;
  const h = learningRoute.health;

  const attendanceChart: HealthChartSlice[] = [
    { key: "p", name: dict.segPresent, value: attendance.present, fill: "var(--color-success)" },
    { key: "a", name: dict.segAbsent, value: attendance.absent, fill: "var(--color-error)" },
    { key: "l", name: dict.segLate, value: attendance.late, fill: "var(--color-accent)" },
    { key: "e", name: dict.segExcused, value: attendance.excused, fill: "var(--color-muted-foreground)" },
  ].filter((r) => r.value > 0);

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

  const flags: string[] = [];
  if (featureFlags.requiresEvaluationsToPass) {
    if (h.missingEntryAssessment) flags.push(dict.flagMissingEntry);
    if (h.missingExitAssessment) flags.push(dict.flagMissingExit);
  }
  if (
    featureFlags.usesLearningRoute &&
    learningRoute.mode === "route" &&
    h.missingObjectives
  ) {
    flags.push(dict.flagMissingObjectives);
  }

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h2 className="text-base font-semibold text-[var(--color-primary)]">{dict.title}</h2>
        <p className="text-sm text-[var(--color-muted-foreground)]">{dict.lead}</p>
        <p className="text-xs text-[var(--color-muted-foreground)]">{dict.windowHint}</p>
      </header>

      <AcademicSectionHealthSummaryStrip locale={locale} snapshot={snapshot} dict={dict} />

      {featureFlags.usesLearningRoute &&
      learningRoute.routeTitle &&
      learningRoute.mode === "route" ? (
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
        payments={paymentChart}
      />
    </div>
  );
}
