import type { ReactNode } from "react";
import type { Dictionary } from "@/types/i18n";
import type { AdminSectionPageData } from "@/lib/academics/loadAdminSectionPageData";
import { resolveAcademicSectionPageSubdicts } from "@/lib/academics/resolveAcademicSectionPageSubdicts";
import { AcademicSectionEnrollCard } from "@/components/organisms/AcademicSectionEnrollCard";
import { AcademicSectionRosterTable } from "@/components/organisms/AcademicSectionRosterTable";
import { AcademicSectionPageHeader } from "@/components/organisms/AcademicSectionPageHeader";
import { AcademicSectionShellWorkspace } from "@/components/organisms/AcademicSectionShellWorkspace";
import { AcademicSectionConfigurationPanel } from "@/components/organisms/AcademicSectionConfigurationPanel";
import { AcademicSectionFeesPanel } from "@/components/organisms/AcademicSectionFeesPanel";
import { AcademicSectionTeachersPanel } from "@/components/organisms/AcademicSectionTeachersPanel";
import { AcademicSectionLearningRoutePanel } from "@/components/organisms/AcademicSectionLearningRoutePanel";
import { AcademicSectionStudentsPanel } from "@/components/organisms/AcademicSectionStudentsPanel";
import { AcademicSectionHealthOverview } from "@/components/organisms/AcademicSectionHealthOverview";
import type { AdminSectionHealthSnapshot } from "@/types/adminSectionHealth";
import type { LearningRouteContentTemplateOption } from "@/types/learningContent";
import type { LearningRouteWorkspace } from "@/lib/learning-content/loadLearningRouteWorkspace";
import type { AdminSectionAssessmentsPanelData } from "@/types/adminSectionAssessments";
import { AcademicSectionAssessmentsPanel } from "@/components/organisms/AcademicSectionAssessmentsPanel";
import type { AcademicSectionShellAreaId } from "@/lib/academics/academicSectionShellTabOrder";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";

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
  /** Institute calendar month used for “current” fee plan in the Fees summary. */
  feesAsOfYear: number;
  feesAsOfMonth: number;
  assessmentsData: AdminSectionAssessmentsPanelData;
  /** When set, opens that area (e.g. from `?tab=evaluations`); `null`/omit = hub. */
  initialShellArea?: AcademicSectionShellAreaId | null;
  canDeleteCohortAssessments: boolean;
}

function countActiveEnrollments(rows: AdminSectionPageData["rows"]) {
  return rows.filter((r) => r.status === "active" || r.status === "completed").length;
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
  feesAsOfYear,
  feesAsOfMonth,
  assessmentsData,
  initialShellArea = null,
  canDeleteCohortAssessments,
}: AcademicSectionPageShellBodyProps) {
  const {
    shellTabLabels,
    settingsSummaryDict,
    scheduleEditorDict,
    periodDict,
    capacityDict,
    minAttendanceDict,
    roomLabelDict,
    nameEditorDict,
    lifecycleDict,
    staffDict,
    feePlansDict,
    enrollmentFeeDict,
    monthlyFeeChargeModeDict,
    allowAdvanceMonthlyPaymentDict,
    feesPanelDict,
    featureFlagsDict,
    learningRouteDict,
    staffAssignedChipsDict,
    healthDict,
    studentsPanelDict,
  } = subdicts;
  const { section, cohort, slots, rows, moveTargets, debtByStudentId, staff, feePlansWithUsage } = data;
  const featureFlags = {
    requiresEvaluationsToPass: section.requiresEvaluationsToPass,
    usesLearningRoute: section.usesLearningRoute,
  };

  return (
    <div className="space-y-6" data-tour={ADMIN_TOUR_ANCHORS.sectionDetail}>
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
        nameEditorDict={nameEditorDict}
      />

      <AcademicSectionShellWorkspace
        key={`section-shell-${initialShellArea ?? "hub"}-${featureFlags.requiresEvaluationsToPass}-${featureFlags.usesLearningRoute}`}
        labels={shellTabLabels}
        initialArea={initialShellArea}
        featureFlags={featureFlags}
        hubOverview={
          <AcademicSectionHealthOverview
            locale={locale}
            snapshot={healthSnapshot}
            dict={healthDict}
            featureFlags={featureFlags}
          />
        }
        configuration={
          <AcademicSectionConfigurationPanel
            locale={locale}
            sectionId={sectionId}
            section={section}
            slots={slots}
            settingsSummaryDict={settingsSummaryDict}
            featureFlagsDict={featureFlagsDict}
            periodDict={periodDict}
            capacityDict={capacityDict}
            minAttendanceDict={minAttendanceDict}
            roomLabelDict={roomLabelDict}
            nameEditorDict={nameEditorDict}
            scheduleEditorDict={scheduleEditorDict}
          />
        }
        teachers={
          <AcademicSectionTeachersPanel
            locale={locale}
            sectionId={sectionId}
            teachers={staff.teachers}
            assistantPortalStaffOptions={staff.assistantPortalStaffOptions}
            initialTeacherId={section.teacherId}
            initialAssistants={staff.initialAssistants}
            initialExternalAssistants={staff.initialExternalAssistants}
            staffDict={staffDict}
            assignedListDict={staffAssignedChipsDict}
            assignedPeople={staff.assignedPeople}
            externalLabels={staff.initialExternalAssistants.map((e) => e.label)}
          />
        }
        learningRoute={
          featureFlags.usesLearningRoute ? (
            <AcademicSectionLearningRoutePanel
              locale={locale}
              cohortId={cohortId}
              sectionId={sectionId}
              routes={routeOptions}
              assignment={learningRouteWorkspace.assignment ?? null}
              dict={learningRouteDict}
            />
          ) : null
        }
        evaluations={
          featureFlags.requiresEvaluationsToPass ? (
            <AcademicSectionAssessmentsPanel
              locale={locale}
              cohortId={cohortId}
              sectionId={sectionId}
              data={assessmentsData}
              dict={d.assessmentsPanel}
              canDeleteCohortAssessments={canDeleteCohortAssessments}
            />
          ) : null
        }
        fees={
          <AcademicSectionFeesPanel
            dict={feesPanelDict}
            locale={locale}
            sectionId={sectionId}
            asOfYear={feesAsOfYear}
            asOfMonth={feesAsOfMonth}
            feePlans={feePlansWithUsage}
            feePlansDict={feePlansDict}
            systemCurrency={systemCurrency}
            enrollmentFeeAmount={section.enrollmentFeeAmount}
            enrollmentFeeDict={enrollmentFeeDict}
            chargeMode={section.monthlyFeeChargeMode}
            monthlyFeeChargeModeDict={monthlyFeeChargeModeDict}
            allowAdvance={section.allowAdvanceMonthlyPayment}
            allowAdvanceMonthlyPaymentDict={allowAdvanceMonthlyPaymentDict}
          />
        }
        attendance={attendancePanel}
        students={
          <AcademicSectionStudentsPanel
            dict={studentsPanelDict}
            activeEnrollmentCount={countActiveEnrollments(rows)}
          >
            <AcademicSectionRosterTable
              locale={locale}
              sectionId={sectionId}
              rows={rows}
              moveTargets={moveTargets}
              dict={d}
              conflictDict={conflictDict}
              errors={errorsDict}
              debtByStudentId={debtByStudentId}
              embedded
              headerActions={
                <AcademicSectionEnrollCard
                  locale={locale}
                  sectionId={sectionId}
                  sectionLabel={cohort.label}
                  dict={d}
                  conflictDict={conflictDict}
                  errors={errorsDict}
                />
              }
            />
          </AcademicSectionStudentsPanel>
        }
      />
    </div>
  );
}
