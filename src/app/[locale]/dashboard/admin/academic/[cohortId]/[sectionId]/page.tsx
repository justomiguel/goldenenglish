import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { loadAdminSectionPageData } from "@/lib/academics/loadAdminSectionPageData";
import { resolveAcademicSectionPageSubdicts } from "@/lib/academics/resolveAcademicSectionPageSubdicts";
import { instituteCalendarDateIso } from "@/lib/datetime/instituteCalendarDateIso";
import { getInstituteTimeZone } from "@/lib/datetime/instituteTimeZone";
import { formatAcademicScheduleSummary } from "@/lib/academics/formatAcademicScheduleSummary";
import { loadAdminSectionAttendanceMatrix } from "@/lib/academics/loadAdminSectionAttendanceMatrix";
import {
  adminAttendanceMatrixColumnMaxIso,
  adminAttendanceMatrixEffMinIso,
  hasEligibleClassDayInWindow,
} from "@/lib/academics/teacherSectionAttendanceCalendar";
import { AcademicSectionPageAttendancePanel } from "@/components/organisms/AcademicSectionPageAttendancePanel";
import { AcademicSectionPageShellBody } from "@/components/organisms/AcademicSectionPageShellBody";
import { resolveEffectiveSectionFeePlan } from "@/lib/billing/resolveEffectiveSectionFeePlan";
import {
  loadGlobalLearningRouteOptions,
  loadSectionLearningRouteWorkspace,
} from "@/lib/learning-content/loadLearningRouteWorkspace";
import { loadAdminSectionHealthSnapshot } from "@/lib/academics/loadAdminSectionHealthSnapshot";
import { loadAdminSectionAssessmentsPanelData } from "@/lib/academics/loadAdminSectionAssessmentsPanelData";
import { parseAcademicSectionShellTabParam } from "@/lib/academics/academicSectionShellTabOrder";
import type { AdminSectionHealthLearningRoute } from "@/types/adminSectionHealth";

interface PageProps {
  params: Promise<{ locale: string; cohortId: string; sectionId: string }>;
  searchParams: Promise<{ tab?: string | string[] }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  return {
    title: dict.dashboard.academicSectionPage.metaTitle,
    robots: { index: false, follow: false },
  };
}

export default async function AcademicSectionPage({ params, searchParams }: PageProps) {
  const { locale, cohortId, sectionId } = await params;
  const sp = await searchParams;
  const defaultShellTab = parseAcademicSectionShellTabParam(sp.tab) ?? "general";
  const dict = await getDictionary(locale);
  const enDict = locale === "en" ? dict : await getDictionary("en");
  const subdicts = resolveAcademicSectionPageSubdicts(dict, enDict);
  const dTeacherAttendance = dict.dashboard.teacherSectionAttendance;
  const supabase = await createClient();

  const [data, routeOptions, learningRouteWorkspace] = await Promise.all([
    loadAdminSectionPageData(supabase, cohortId, sectionId),
    loadGlobalLearningRouteOptions(supabase),
    loadSectionLearningRouteWorkspace(supabase, sectionId),
  ]);
  if (!data) notFound();
  const { section, slots, rows, debtByStudentId, staff, feePlans } = data;
  const leadTeacherLabel = staff.teachers.find((t) => t.id === section.teacherId)?.label ?? null;
  const assistantChipLabels = staff.initialAssistants.map((a) => a.label);
  const externalChipLabels = staff.initialExternalAssistants.map((e) => e.label);
  const activeRows = rows.filter((r) => r.status === "active");
  const activeEnrollmentIds = activeRows.map((r) => r.enrollmentId);
  const activeStudentIds = [...new Set(activeRows.map((r) => r.studentId))];

  const learningRouteHealthBlock: AdminSectionHealthLearningRoute = {
    mode: learningRouteWorkspace.assignment?.mode ?? null,
    routeTitle: learningRouteWorkspace.route?.title ?? null,
    plannedSteps: learningRouteWorkspace.routeSteps.length,
    health: learningRouteWorkspace.health,
  };

  const healthSnapshotPromise = loadAdminSectionHealthSnapshot(supabase, {
    sectionId,
    cohortId: section.cohortId,
    effectiveMaxStudents: section.effectiveMaxStudents,
    activeEnrollmentIds,
    activeStudentIds,
    debtByStudentId,
    learningRoute: learningRouteHealthBlock,
  });

  const today = new Date();
  const currentPlan = resolveEffectiveSectionFeePlan(
    feePlans,
    today.getFullYear(),
    today.getMonth() + 1,
  );
  const currentPlanCurrency = currentPlan?.currency ?? null;

  const instituteTz = getInstituteTimeZone();
  const todayIso = instituteCalendarDateIso(new Date(), instituteTz);
  const attendanceEffMin = adminAttendanceMatrixEffMinIso(todayIso, section.startsOn);
  const attendanceColumnMax = adminAttendanceMatrixColumnMaxIso(todayIso, section.endsOn);
  const attendanceWindowOk = attendanceEffMin <= attendanceColumnMax;
  const hasScheduleSlots = slots.length > 0;
  const hasEligibleAttendanceDays =
    hasScheduleSlots && hasEligibleClassDayInWindow(attendanceEffMin, attendanceColumnMax, slots, instituteTz);
  const attendanceScheduleSummary = formatAcademicScheduleSummary(slots, locale);
  const attendanceScheduleLine = attendanceScheduleSummary
    ? `${dTeacherAttendance.scheduleSummaryLead} ${attendanceScheduleSummary}`
    : "";
  const [attendanceMatrix, healthSnapshot, assessmentsData] = await Promise.all([
    hasEligibleAttendanceDays ? loadAdminSectionAttendanceMatrix(supabase, sectionId) : Promise.resolve(null),
    healthSnapshotPromise,
    loadAdminSectionAssessmentsPanelData(supabase, sectionId, section.cohortId, activeEnrollmentIds),
  ]);
  const editableByDate = Object.fromEntries(
    (attendanceMatrix?.classDays ?? []).map((day) => [day, day <= todayIso]),
  );
  const attendancePanel = (
    <AcademicSectionPageAttendancePanel
      locale={locale}
      sectionId={sectionId}
      todayIso={todayIso}
      attendanceScheduleLine={attendanceScheduleLine}
      attendanceWindowOk={attendanceWindowOk}
      hasScheduleSlots={hasScheduleSlots}
      hasEligibleAttendanceDays={hasEligibleAttendanceDays}
      attendanceMatrix={attendanceMatrix}
      editableByDate={editableByDate}
      dTeacherAttendance={dTeacherAttendance}
    />
  );

  return (
    <AcademicSectionPageShellBody
      locale={locale}
      cohortId={cohortId}
      sectionId={sectionId}
      attendancePanel={attendancePanel}
      healthSnapshot={healthSnapshot}
      subdicts={subdicts}
      pageDict={dict.dashboard.academicSectionPage}
      conflictDict={dict.dashboard.academics.conflictModal}
      errorsDict={dict.dashboard.academics.errors}
      data={data}
      routeOptions={routeOptions}
      learningRouteWorkspace={learningRouteWorkspace}
      currentPlanCurrency={currentPlanCurrency}
      leadTeacherLabel={leadTeacherLabel}
      assistantChipLabels={assistantChipLabels}
      externalChipLabels={externalChipLabels}
      assessmentsData={assessmentsData}
      defaultShellTab={defaultShellTab}
    />
  );
}
