import type { Dictionary } from "@/types/i18n";
import type { AdminSectionHealthSnapshot } from "@/types/adminSectionHealth";
import { AcademicSectionHealthCharts } from "@/components/molecules/AcademicSectionHealthCharts";
import { AcademicSectionHealthKpiGrid } from "@/components/molecules/AcademicSectionHealthKpiGrid";

export interface AcademicSectionHealthOverviewProps {
  locale: string;
  snapshot: AdminSectionHealthSnapshot;
  dict: Dictionary["dashboard"]["academicSectionPage"]["health"];
}

export function AcademicSectionHealthOverview({ locale, snapshot, dict }: AcademicSectionHealthOverviewProps) {
  const { attendance, tasks, learningRoute } = snapshot;
  const h = learningRoute.health;

  const attendanceChart = [
    { key: "p", name: dict.segPresent, value: attendance.present, fill: "var(--color-success)" },
    { key: "a", name: dict.segAbsent, value: attendance.absent, fill: "var(--color-error)" },
    { key: "l", name: dict.segLate, value: attendance.late, fill: "var(--color-accent)" },
    { key: "e", name: dict.segExcused, value: attendance.excused, fill: "var(--color-muted-foreground)" },
  ].filter((r) => r.value > 0);

  const taskChart = [
    { key: "n", name: dict.segNotOpened, value: tasks.notOpened, fill: "var(--color-muted-foreground)" },
    { key: "o", name: dict.segOpened, value: tasks.opened, fill: "var(--color-primary)" },
    { key: "c", name: dict.segCompleted, value: tasks.completed, fill: "var(--color-success)" },
  ].filter((r) => r.value > 0);

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

      <AcademicSectionHealthKpiGrid locale={locale} snapshot={snapshot} dict={dict} />

      <AcademicSectionHealthCharts locale={locale} dict={dict} attendance={attendanceChart} tasks={taskChart} />
    </div>
  );
}
