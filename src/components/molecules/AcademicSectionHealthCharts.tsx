"use client";

import { useCallback, useState } from "react";
import type { Dictionary } from "@/types/i18n";
import { AcademicSectionHealthChartHelpModal } from "@/components/molecules/AcademicSectionHealthChartHelpModal";
import { AcademicSectionHealthChartShell } from "@/components/molecules/AcademicSectionHealthChartShell";
import {
  HealthAttendanceCompositionBar,
  HealthPaymentsDonutChart,
  type HealthChartSlice,
} from "@/components/molecules/AcademicSectionHealthChartPlots";

export type { HealthChartSlice };

export interface AcademicSectionHealthChartsProps {
  locale: string;
  dict: Dictionary["dashboard"]["academicSectionPage"]["health"];
  attendance: HealthChartSlice[];
  payments: HealthChartSlice[];
}

/** Lean hub charts: attendance + payments only (see section hub navigation spec). */
export function AcademicSectionHealthCharts({
  locale,
  dict,
  attendance,
  payments,
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
  const payTotal = payments.reduce((s, r) => s + r.value, 0);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
          title={dict.chartPaymentsTitle}
          empty={dict.chartEmpty}
          hasData={payTotal > 0}
          helpAriaLabel={dict.chartHelpAria}
          onOpenHelp={() => openHelp(dict.chartPaymentsTitle, dict.chartHelpPaymentsBody)}
        >
          <HealthPaymentsDonutChart locale={locale} slices={payments} />
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
