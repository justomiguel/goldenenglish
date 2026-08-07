import { Settings2 } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import type { AdminSectionPageData } from "@/lib/academics/loadAdminSectionPageData";
import { AcademicSectionAreaBlock } from "@/components/molecules/AcademicSectionAreaBlock";
import { AcademicSectionPeriodEditor } from "@/components/organisms/AcademicSectionPeriodEditor";
import { AcademicSectionRoomLabelEditor } from "@/components/organisms/AcademicSectionRoomLabelEditor";
import { AcademicSectionCapacityEditor } from "@/components/organisms/AcademicSectionCapacityEditor";
import { AcademicSectionMinAttendanceEditor } from "@/components/organisms/AcademicSectionMinAttendanceEditor";
import { AcademicSectionFeatureFlagsEditor } from "@/components/organisms/AcademicSectionFeatureFlagsEditor";

type PageDict = Dictionary["dashboard"]["academicSectionPage"];

export interface AcademicSectionSettingsSummaryProps {
  locale: string;
  sectionId: string;
  section: AdminSectionPageData["section"];
  dict: PageDict["settingsSummary"];
  featureFlagsDict: PageDict["featureFlags"];
  periodDict: PageDict["period"];
  capacityDict: PageDict["capacity"];
  minAttendanceDict: PageDict["minAttendance"];
  roomLabelDict: PageDict["roomLabel"];
}

export function AcademicSectionSettingsSummary({
  locale,
  sectionId,
  section,
  dict,
  featureFlagsDict,
  periodDict,
  capacityDict,
  minAttendanceDict,
  roomLabelDict,
}: AcademicSectionSettingsSummaryProps) {
  return (
    <AcademicSectionAreaBlock
      id="section-configuration-settings-heading"
      title={dict.title}
      lead={dict.lead}
      icon={Settings2}
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-[var(--layout-border-radius)] bg-[var(--color-muted)]/40 p-4">
          <h3 className="text-sm font-semibold text-[var(--color-foreground)]">{dict.groups.class.title}</h3>
          <div className="mt-3 space-y-4">
            <AcademicSectionPeriodEditor
              embedded
              locale={locale}
              sectionId={sectionId}
              initialStartsOn={section.startsOn}
              initialEndsOn={section.endsOn}
              dict={periodDict}
            />
            <AcademicSectionRoomLabelEditor
              embedded
              locale={locale}
              sectionId={sectionId}
              initialRoomLabel={section.roomLabel}
              dict={roomLabelDict}
            />
          </div>
        </div>

        <div className="rounded-[var(--layout-border-radius)] bg-[var(--color-muted)]/40 p-4">
          <h3 className="text-sm font-semibold text-[var(--color-foreground)]">
            {dict.groups.capacity.title}
          </h3>
          <div className="mt-3 space-y-4">
            <AcademicSectionCapacityEditor
              embedded
              locale={locale}
              sectionId={sectionId}
              initialMaxStudents={section.effectiveMaxStudents}
              activeEnrollments={section.activeEnrollmentCount}
              siteDefaultMax={section.siteDefaultMax}
              dict={capacityDict}
            />
            <AcademicSectionMinAttendanceEditor
              embedded
              locale={locale}
              sectionId={sectionId}
              initialSectionOverride={section.minAttendancePercentOverride}
              siteDefaultMin={section.siteDefaultMinAttendancePercent}
              dict={minAttendanceDict}
            />
          </div>
        </div>

        <div className="rounded-[var(--layout-border-radius)] bg-[var(--color-muted)]/40 p-4">
          <h3 className="text-sm font-semibold text-[var(--color-foreground)]">
            {dict.groups.features.title}
          </h3>
          <div className="mt-3">
            <AcademicSectionFeatureFlagsEditor
              key={`flags-${section.requiresEvaluationsToPass}-${section.usesLearningRoute}`}
              embedded
              locale={locale}
              sectionId={sectionId}
              initialRequiresEvaluationsToPass={section.requiresEvaluationsToPass}
              initialUsesLearningRoute={section.usesLearningRoute}
              dict={featureFlagsDict}
            />
          </div>
        </div>
      </div>
    </AcademicSectionAreaBlock>
  );
}
