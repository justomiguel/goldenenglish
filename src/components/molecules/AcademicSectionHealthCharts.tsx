"use client";

import { useCallback, useState } from "react";
import type { Dictionary } from "@/types/i18n";
import { AcademicSectionHealthChartHelpModal } from "@/components/molecules/AcademicSectionHealthChartHelpModal";
import { AcademicSectionHealthChartShell } from "@/components/molecules/AcademicSectionHealthChartShell";
import {
  HealthAssessmentsRowsBarChart,
  HealthAttendanceCompositionBar,
  HealthCapacityTreemap,
  HealthEngagementColumnsBarChart,
  HealthPaymentsDonutChart,
  HealthReadinessColumnsBarChart,
  HealthTasksRadialBarChart,
  type HealthChartSlice,
} from "@/components/molecules/AcademicSectionHealthChartPlots";

export type { HealthChartSlice };

export interface AcademicSectionHealthChartsProps {
  locale: string;
  dict: Dictionary["dashboard"]["academicSectionPage"]["health"];
  attendance: HealthChartSlice[];
  tasks: HealthChartSlice[];
  capacity: HealthChartSlice[] | null;
  payments: HealthChartSlice[];
  engagement: { key: string; name: string; value: number }[];
  assessments: HealthChartSlice[];
  readiness: HealthChartSlice[];
}

export function AcademicSectionHealthCharts({
  locale,
  dict,
  attendance,
  tasks,
  capacity,
  payments,
  engagement,
  assessments,
  readiness,
}: AcademicSectionHealthChartsProps) {
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpTitle, setHelpTitle] = useState("");
  const [helpBody, setHelpBody] = useState("");

  const openHelp = useCallback((title: string, body: string) => {
    setHelpTitle(title);
    setHelpBody(body);
    setHelpOpen(true);
  }, []);

  const attTotal = attendance.reduce((s, r) => s + r.value, 0);
  const taskTotal = tasks.reduce((s, r) => s + r.value, 0);
  const capTotal = capacity?.reduce((s, r) => s + r.value, 0) ?? 0;
  const payTotal = payments.reduce((s, r) => s + r.value, 0);
  const engTotal = engagement.reduce((s, r) => s + r.value, 0);
  const assTotal = assessments.reduce((s, r) => s + r.value, 0);
  const readTotal = readiness.reduce((s, r) => s + r.value, 0);

  const engagementBars = engagement.map((e, i) => ({
    ...e,
    fill: ["var(--color-primary)", "var(--color-success)", "var(--color-info)"][i % 3],
  }));

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <AcademicSectionHealthChartShell
          title={dict.chartAttendanceTitle}
          empty={dict.chartEmpty}
          hasData={attTotal > 0}
          helpAriaLabel={dict.chartHelpAria}
          onOpenHelp={() => openHelp(dict.chartAttendanceTitle, dict.chartHelpAttendanceBody)}
        >
          <HealthAttendanceCompositionBar locale={locale} data={attendance} />
        </AcademicSectionHealthChartShell>

        <AcademicSectionHealthChartShell
          title={dict.chartTasksTitle}
          empty={dict.chartEmpty}
          hasData={taskTotal > 0}
          helpAriaLabel={dict.chartHelpAria}
          onOpenHelp={() => openHelp(dict.chartTasksTitle, dict.chartHelpTasksBody)}
        >
          <HealthTasksRadialBarChart locale={locale} tasks={tasks} />
        </AcademicSectionHealthChartShell>

        <AcademicSectionHealthChartShell
          title={dict.chartCapacityTitle}
          empty={dict.chartEmpty}
          hasData={Boolean(capacity && capTotal > 0)}
          helpAriaLabel={dict.chartHelpAria}
          onOpenHelp={() => openHelp(dict.chartCapacityTitle, dict.chartHelpCapacityBody)}
        >
          {capacity && capTotal > 0 ? <HealthCapacityTreemap locale={locale} slices={capacity} /> : null}
        </AcademicSectionHealthChartShell>

        <AcademicSectionHealthChartShell
          title={dict.chartPaymentsTitle}
          empty={dict.chartEmpty}
          hasData={payTotal > 0}
          helpAriaLabel={dict.chartHelpAria}
          onOpenHelp={() => openHelp(dict.chartPaymentsTitle, dict.chartHelpPaymentsBody)}
        >
          <HealthPaymentsDonutChart locale={locale} slices={payments} />
        </AcademicSectionHealthChartShell>

        <AcademicSectionHealthChartShell
          title={dict.chartEngagementTitle}
          empty={dict.chartEmpty}
          hasData={engTotal > 0}
          helpAriaLabel={dict.chartHelpAria}
          onOpenHelp={() => openHelp(dict.chartEngagementTitle, dict.chartHelpEngagementBody)}
        >
          <HealthEngagementColumnsBarChart locale={locale} bars={engagementBars} />
        </AcademicSectionHealthChartShell>

        <AcademicSectionHealthChartShell
          title={dict.chartAssessmentsTitle}
          empty={dict.chartEmpty}
          hasData={assTotal > 0}
          helpAriaLabel={dict.chartHelpAria}
          onOpenHelp={() => openHelp(dict.chartAssessmentsTitle, dict.chartHelpAssessmentsBody)}
        >
          <HealthAssessmentsRowsBarChart locale={locale} assessments={assessments} />
        </AcademicSectionHealthChartShell>

        <AcademicSectionHealthChartShell
          title={dict.chartReadinessTitle}
          empty={dict.chartEmpty}
          hasData={readTotal > 0}
          helpAriaLabel={dict.chartHelpAria}
          onOpenHelp={() => openHelp(dict.chartReadinessTitle, dict.chartHelpReadinessBody)}
        >
          <HealthReadinessColumnsBarChart locale={locale} readiness={readiness} />
        </AcademicSectionHealthChartShell>
      </div>

      <AcademicSectionHealthChartHelpModal
        open={helpOpen}
        onOpenChange={setHelpOpen}
        title={helpTitle}
        body={helpBody}
        closeLabel={dict.chartHelpClose}
      />
    </>
  );
}
