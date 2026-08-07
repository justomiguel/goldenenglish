import type { Dictionary } from "@/types/i18n";
import type { AdminSectionPageData } from "@/lib/academics/loadAdminSectionPageData";
import type { SectionScheduleSlot } from "@/types/academics";
import { AcademicSectionScheduleEditor } from "@/components/organisms/AcademicSectionScheduleEditor";
import { AcademicSectionSettingsSummary } from "@/components/organisms/AcademicSectionSettingsSummary";

type PageDict = Dictionary["dashboard"]["academicSectionPage"];

export interface AcademicSectionConfigurationPanelProps {
  locale: string;
  sectionId: string;
  section: AdminSectionPageData["section"];
  slots: SectionScheduleSlot[];
  settingsSummaryDict: PageDict["settingsSummary"];
  featureFlagsDict: PageDict["featureFlags"];
  periodDict: PageDict["period"];
  capacityDict: PageDict["capacity"];
  minAttendanceDict: PageDict["minAttendance"];
  roomLabelDict: PageDict["roomLabel"];
  nameEditorDict: PageDict["nameEditor"];
  scheduleEditorDict: PageDict["scheduleEditor"];
}

export function AcademicSectionConfigurationPanel({
  locale,
  sectionId,
  section,
  slots,
  settingsSummaryDict,
  featureFlagsDict,
  periodDict,
  capacityDict,
  minAttendanceDict,
  roomLabelDict,
  nameEditorDict,
  scheduleEditorDict,
}: AcademicSectionConfigurationPanelProps) {
  return (
    <div className="space-y-8">
      <AcademicSectionSettingsSummary
        locale={locale}
        sectionId={sectionId}
        section={section}
        dict={settingsSummaryDict}
        featureFlagsDict={featureFlagsDict}
        periodDict={periodDict}
        capacityDict={capacityDict}
        minAttendanceDict={minAttendanceDict}
        roomLabelDict={roomLabelDict}
        nameEditorDict={nameEditorDict}
      />
      <AcademicSectionScheduleEditor
        locale={locale}
        sectionId={sectionId}
        initialSlots={slots}
        dict={scheduleEditorDict}
      />
    </div>
  );
}
