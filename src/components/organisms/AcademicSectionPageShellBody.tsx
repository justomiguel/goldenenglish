import type { ReactNode } from "react";
import type { Dictionary } from "@/types/i18n";
import type { AdminSectionPageData } from "@/lib/academics/loadAdminSectionPageData";
import { resolveAcademicSectionPageSubdicts } from "@/lib/academics/resolveAcademicSectionPageSubdicts";
import { AcademicSectionStaffAssignedChips } from "@/components/molecules/AcademicSectionStaffAssignedChips";
import { AcademicSectionScheduleEditor } from "@/components/organisms/AcademicSectionScheduleEditor";
import { AcademicSectionEnrollCard } from "@/components/organisms/AcademicSectionEnrollCard";
import { AcademicSectionRosterTable } from "@/components/organisms/AcademicSectionRosterTable";
import { AcademicSectionPageHeader } from "@/components/organisms/AcademicSectionPageHeader";
import { AcademicSectionPeriodEditor } from "@/components/organisms/AcademicSectionPeriodEditor";
import { AcademicSectionStaffEditor } from "@/components/organisms/AcademicSectionStaffEditor";
import { AcademicSectionShellTabs } from "@/components/organisms/AcademicSectionShellTabs";
import { AcademicSectionCapacityEditor } from "@/components/organisms/AcademicSectionCapacityEditor";
import { AcademicSectionMinAttendanceEditor } from "@/components/organisms/AcademicSectionMinAttendanceEditor";
import { AcademicSectionRoomLabelEditor } from "@/components/organisms/AcademicSectionRoomLabelEditor";
import { AcademicSectionFeePlansEditor } from "@/components/organisms/AcademicSectionFeePlansEditor";
import { AcademicSectionEnrollmentFeeEditor } from "@/components/organisms/AcademicSectionEnrollmentFeeEditor";
import { AcademicSectionMonthlyFeeChargeModeEditor } from "@/components/organisms/AcademicSectionMonthlyFeeChargeModeEditor";
import { AcademicSectionAdvanceMonthlyPaymentEditor } from "@/components/organisms/AcademicSectionAdvanceMonthlyPaymentEditor";
import { AcademicSectionLearningRouteSelector } from "@/components/organisms/AcademicSectionLearningRouteSelector";
import { AcademicSectionHealthOverview } from "@/components/organisms/AcademicSectionHealthOverview";
import type { AdminSectionHealthSnapshot } from "@/types/adminSectionHealth";
import type { LearningRouteContentTemplateOption } from "@/types/learningContent";
import type { LearningRouteWorkspace } from "@/lib/learning-content/loadLearningRouteWorkspace";
import type { AdminSectionAssessmentsPanelData } from "@/types/adminSectionAssessments";
import { AcademicSectionAssessmentsPanel } from "@/components/organisms/AcademicSectionAssessmentsPanel";
import type { AcademicSectionShellTabId } from "@/lib/academics/academicSectionShellTabOrder";

export interface AcademicSectionPageShellBodyProps {
  locale: string;
  cohortId: string;
  sectionId: string;
  attendancePanel: ReactNode;
  healthSnapshot: AdminSectionHealthSnapshot;
  subdicts: ReturnType<typeof resolveAcademicSectionPageSubdicts>;
  pageDict: Dictionary["dashboard"]["academicSectionPage"];
  conflictDict: Dictionary["dashboard"]["academics"]["conflictModal"];
  errorsDict: Dictionary["dashboard"]["academics"]["errors"];
  data: AdminSectionPageData;
  routeOptions: LearningRouteContentTemplateOption[];
  learningRouteWorkspace: LearningRouteWorkspace;
  /** System-wide billing currency from Finance > Settings. */
  systemCurrency: string;
  leadTeacherLabel: string | null;
  assistantChipLabels: string[];
  externalChipLabels: string[];
  assessmentsData: AdminSectionAssessmentsPanelData;
  /** When set, opens the tab (e.g. from `?tab=evaluations` in the section URL). */
  defaultShellTab?: AcademicSectionShellTabId;
  canDeleteCohortAssessments: boolean;
}

export function AcademicSectionPageShellBody({
  locale,
  cohortId,
  sectionId,
  attendancePanel,
  healthSnapshot,
  subdicts,
  pageDict: d,
  conflictDict,
  errorsDict,
  data,
  routeOptions,
  learningRouteWorkspace,
  systemCurrency,
  leadTeacherLabel,
  assistantChipLabels,
  externalChipLabels,
  assessmentsData,
  defaultShellTab,
  canDeleteCohortAssessments,
}: AcademicSectionPageShellBodyProps) {
  const {
    shellTabLabels,
    scheduleEditorDict,
    periodDict,
    capacityDict,
    minAttendanceDict,
    roomLabelDict,
    lifecycleDict,
    staffDict,
    feePlansDict,
    enrollmentFeeDict,
    monthlyFeeChargeModeDict,
    allowAdvanceMonthlyPaymentDict,
    learningRouteDict,
    staffAssignedChipsDict,
    healthDict,
  } = subdicts;
  const { section, cohort, slots, rows, moveTargets, debtByStudentId, staff, feePlansWithUsage } = data;

  return (
    <div className="space-y-6">
      <AcademicSectionPageHeader
        locale={locale}
        cohortId={cohortId}
        sectionId={sectionId}
        sectionName={section.name}
        cohortName={cohort.name}
        sectionArchivedAt={section.archivedAt}
        cohortArchivedAt={cohort.archivedAt}
        backCohortLabel={d.backCohort}
        sectionLead={d.sectionLead}
        lifecycleDict={lifecycleDict}
      />

      <AcademicSectionShellTabs
        labels={shellTabLabels}
        defaultTab={defaultShellTab}
        general={<AcademicSectionHealthOverview locale={locale} snapshot={healthSnapshot} dict={healthDict} />}
        configuration={
          <>
            <AcademicSectionPeriodEditor
              locale={locale}
              sectionId={sectionId}
              initialStartsOn={section.startsOn}
              initialEndsOn={section.endsOn}
              dict={periodDict}
            />
            <AcademicSectionCapacityEditor
              locale={locale}
              sectionId={sectionId}
              initialMaxStudents={section.effectiveMaxStudents}
              activeEnrollments={section.activeEnrollmentCount}
              siteDefaultMax={section.siteDefaultMax}
              dict={capacityDict}
            />
            <AcademicSectionMinAttendanceEditor
              locale={locale}
              sectionId={sectionId}
              initialSectionOverride={section.minAttendancePercentOverride}
              siteDefaultMin={section.siteDefaultMinAttendancePercent}
              dict={minAttendanceDict}
            />
            <AcademicSectionRoomLabelEditor
              locale={locale}
              sectionId={sectionId}
              initialRoomLabel={section.roomLabel}
              dict={roomLabelDict}
            />
            <AcademicSectionScheduleEditor
              locale={locale}
              sectionId={sectionId}
              initialSlots={slots}
              dict={scheduleEditorDict}
            />
          </>
        }
        teachers={
          <>
            <AcademicSectionStaffAssignedChips
              leadTeacherLabel={leadTeacherLabel}
              assistantLabels={assistantChipLabels}
              externalLabels={externalChipLabels}
              dict={staffAssignedChipsDict}
            />
            <AcademicSectionStaffEditor
              locale={locale}
              sectionId={sectionId}
              teachers={staff.teachers}
              assistantPortalStaffOptions={staff.assistantPortalStaffOptions}
              initialTeacherId={section.teacherId}
              initialAssistants={staff.initialAssistants}
              initialExternalAssistants={staff.initialExternalAssistants}
              dict={staffDict}
            />
          </>
        }
        learningRoute={
          <AcademicSectionLearningRouteSelector
            locale={locale}
            cohortId={cohortId}
            sectionId={sectionId}
            routes={routeOptions}
            assignment={learningRouteWorkspace.assignment ?? null}
            dict={learningRouteDict}
          />
        }
        evaluations={
          <AcademicSectionAssessmentsPanel
            locale={locale}
            cohortId={cohortId}
            sectionId={sectionId}
            data={assessmentsData}
            dict={d.assessmentsPanel}
            canDeleteCohortAssessments={canDeleteCohortAssessments}
          />
        }
        fees={
          <div className="space-y-4">
            <AcademicSectionMonthlyFeeChargeModeEditor
              locale={locale}
              sectionId={sectionId}
              initialMode={section.monthlyFeeChargeMode}
              dict={monthlyFeeChargeModeDict}
            />
            <AcademicSectionAdvanceMonthlyPaymentEditor
              locale={locale}
              sectionId={sectionId}
              initialAllowAdvance={section.allowAdvanceMonthlyPayment}
              dict={allowAdvanceMonthlyPaymentDict}
            />
            <AcademicSectionFeePlansEditor
              locale={locale}
              sectionId={sectionId}
              initialPlans={feePlansWithUsage}
              systemCurrency={systemCurrency}
              dict={feePlansDict}
            />
            <AcademicSectionEnrollmentFeeEditor
              locale={locale}
              sectionId={sectionId}
              initialAmount={section.enrollmentFeeAmount}
              dict={enrollmentFeeDict}
            />
          </div>
        }
        attendance={attendancePanel}
        students={
          <>
            <AcademicSectionEnrollCard
              locale={locale}
              sectionId={sectionId}
              sectionLabel={cohort.label}
              dict={d}
              conflictDict={conflictDict}
              errors={errorsDict}
            />
            <AcademicSectionRosterTable
              locale={locale}
              sectionId={sectionId}
              rows={rows}
              moveTargets={moveTargets}
              dict={d}
              conflictDict={conflictDict}
              errors={errorsDict}
              debtByStudentId={debtByStudentId}
            />
          </>
        }
      />
    </div>
  );
}
