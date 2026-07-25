import { GraduationCap } from "lucide-react";
import { AcademicSectionAreaBlock } from "@/components/molecules/AcademicSectionAreaBlock";
import { AcademicSectionAreaSummaryBand } from "@/components/molecules/AcademicSectionAreaSummaryBand";
import { AcademicSectionStaffAssignedList } from "@/components/molecules/AcademicSectionStaffAssignedList";
import {
  AcademicSectionStaffEditor,
  type AcademicSectionStaffEditorDict,
} from "@/components/organisms/AcademicSectionStaffEditor";
import type { AcademicSectionStaffAssignedListDict } from "@/components/molecules/AcademicSectionStaffAssignedList";
import type {
  SectionStaffPortalPickOption,
  SectionStaffProfileAssistant,
} from "@/lib/academics/loadAdminSectionTeachersAndAssistants";
import type { SectionStaffAssignedPerson } from "@/lib/academics/sectionStaffAssignedPerson";

export interface AcademicSectionTeachersPanelProps {
  locale: string;
  sectionId: string;
  teachers: { id: string; label: string }[];
  assistantPortalStaffOptions: SectionStaffPortalPickOption[];
  initialTeacherId: string;
  initialAssistants: SectionStaffProfileAssistant[];
  initialExternalAssistants: { id: string; label: string }[];
  staffDict: AcademicSectionStaffEditorDict;
  assignedListDict: AcademicSectionStaffAssignedListDict;
  assignedPeople: SectionStaffAssignedPerson[];
  externalLabels: string[];
}

export function AcademicSectionTeachersPanel({
  locale,
  sectionId,
  teachers,
  assistantPortalStaffOptions,
  initialTeacherId,
  initialAssistants,
  initialExternalAssistants,
  staffDict,
  assignedListDict,
  assignedPeople,
  externalLabels,
}: AcademicSectionTeachersPanelProps) {
  return (
    <div className="space-y-8">
      <AcademicSectionAreaSummaryBand ariaLabelledBy="academic-section-staff-assigned-list-h">
        <AcademicSectionStaffAssignedList
          locale={locale}
          people={assignedPeople}
          externalLabels={externalLabels}
          dict={assignedListDict}
          embedded
        />
      </AcademicSectionAreaSummaryBand>

      <AcademicSectionAreaBlock
        id="section-teachers-manage-heading"
        title={staffDict.title}
        lead={staffDict.manageBlockLead}
        icon={GraduationCap}
      >
        <AcademicSectionStaffEditor
          locale={locale}
          sectionId={sectionId}
          teachers={teachers}
          assistantPortalStaffOptions={assistantPortalStaffOptions}
          initialTeacherId={initialTeacherId}
          initialAssistants={initialAssistants}
          initialExternalAssistants={initialExternalAssistants}
          dict={staffDict}
          embedded
        />
      </AcademicSectionAreaBlock>
    </div>
  );
}
