import type { Dictionary } from "@/types/i18n";
import type { AdminSectionPageData } from "@/lib/academics/loadAdminSectionPageData";
import type { SectionScheduleSlot } from "@/types/academics";
import type { CommercialPlan } from "@/lib/pulsar/commercialPlan";
import { AcademicSectionScheduleEditor } from "@/components/organisms/AcademicSectionScheduleEditor";
import { AcademicSectionSettingsSummary } from "@/components/organisms/AcademicSectionSettingsSummary";

type PageDict = Dictionary["dashboard"]["academicSectionPage"];

export interface AcademicSectionConfigurationPanelProps {
  locale: string;
  sectionId: string;
  section: AdminSectionPageData["section"];
  commercialPlan: CommercialPlan;
  dailyCredentialsReady: boolean;
  deliveryModeDict: PageDict["deliveryMode"];
  slots: SectionScheduleSlot[];
  settingsSummaryDict: PageDict["settingsSummary"];
  featureFlagsDict: PageDict["featureFlags"];
  periodDict: PageDict["period"];
  capacityDict: PageDict["capacity"];
  minAttendanceDict: PageDict["minAttendance"];
  roomLabelDict: PageDict["roomLabel"];
  nameEditorDict: PageDict["nameEditor"];
  referenceImageDict: PageDict["referenceImage"];
  scheduleEditorDict: PageDict["scheduleEditor"];
}

export function AcademicSectionConfigurationPanel({
  locale,
  sectionId,
  section,
  commercialPlan,
  dailyCredentialsReady,
  deliveryModeDict,
  slots,
  settingsSummaryDict,
  featureFlagsDict,
  periodDict,
  capacityDict,
  minAttendanceDict,
  roomLabelDict,
  nameEditorDict,
  referenceImageDict,
  scheduleEditorDict,
}: AcademicSectionConfigurationPanelProps) {
  return (
    <div className="space-y-8">
      <AcademicSectionSettingsSummary
        locale={locale}
        sectionId={sectionId}
        section={section}
        commercialPlan={commercialPlan}
        dailyCredentialsReady={dailyCredentialsReady}
        deliveryModeDict={deliveryModeDict}
        dict={settingsSummaryDict}
        featureFlagsDict={featureFlagsDict}
        periodDict={periodDict}
        capacityDict={capacityDict}
        minAttendanceDict={minAttendanceDict}
        roomLabelDict={roomLabelDict}
        nameEditorDict={nameEditorDict}
        referenceImageDict={referenceImageDict}
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
