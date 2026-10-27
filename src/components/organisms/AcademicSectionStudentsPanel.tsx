import type { ReactNode } from "react";
import { Users } from "lucide-react";
import { AcademicSectionAreaBlock } from "@/components/molecules/AcademicSectionAreaBlock";
import { AcademicSectionAreaSummaryBand } from "@/components/molecules/AcademicSectionAreaSummaryBand";

export interface AcademicSectionStudentsPanelDict {
  summaryTitle: string;
  summaryActiveLabel: string;
  rosterTitle: string;
  rosterLead: string;
}

export interface AcademicSectionStudentsPanelProps {
  dict: AcademicSectionStudentsPanelDict;
  activeEnrollmentCount: number;
  children: ReactNode;
}

export function AcademicSectionStudentsPanel({
  dict,
  activeEnrollmentCount,
  children,
}: AcademicSectionStudentsPanelProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <AcademicSectionAreaSummaryBand ariaLabel={dict.summaryTitle}>
        <div className="flex items-center justify-between gap-3 sm:block">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
            {dict.summaryActiveLabel}
          </p>
          <p className="text-base font-semibold tabular-nums text-[var(--color-foreground)] sm:mt-1 sm:text-lg">
            {activeEnrollmentCount}
          </p>
        </div>
      </AcademicSectionAreaSummaryBand>

      <AcademicSectionAreaBlock
        id="section-students-roster-heading"
        title={dict.rosterTitle}
        lead={dict.rosterLead}
        icon={Users}
      >
        {children}
      </AcademicSectionAreaBlock>
    </div>
  );
}
