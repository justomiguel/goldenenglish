/**
 * Subject: AcademicSectionAreaPanels — shared Fees-style block chrome on section areas.
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AcademicSectionTeachersPanel } from "@/components/organisms/AcademicSectionTeachersPanel";
import { AcademicSectionLearningRoutePanel } from "@/components/organisms/AcademicSectionLearningRoutePanel";
import { AcademicSectionAssessmentsPanel } from "@/components/organisms/AcademicSectionAssessmentsPanel";
import { AcademicSectionStudentsPanel } from "@/components/organisms/AcademicSectionStudentsPanel";
import { AcademicSectionPageAttendancePanel } from "@/components/organisms/AcademicSectionPageAttendancePanel";

vi.mock("@/components/organisms/AcademicSectionStaffEditor", () => ({
  AcademicSectionStaffEditor: () => <div data-testid="staff-editor" />,
}));

vi.mock("@/components/organisms/AcademicSectionLearningRouteSelector", () => ({
  AcademicSectionLearningRouteSelector: () => <div data-testid="learning-route-selector" />,
}));

vi.mock("@/components/molecules/CohortAssessmentRowActions", () => ({
  CohortAssessmentRowActions: () => null,
}));

vi.mock("@/components/organisms/SectionAttendanceMatrix", () => ({
  SectionAttendanceMatrix: () => <div data-testid="attendance-matrix" />,
}));

const staffDict = {
  title: "Teaching staff",
  manageBlockLead: "Manage staff for this section.",
  leadOpenButton: "Change lead",
  leadModalTitle: "Lead",
  leadLabel: "Lead",
  leadSave: "Save",
  leadSaved: "Saved",
  leadError: "Error",
  assistantsOpenButton: "Assistants",
  assistantsModalTitle: "Assistants",
  assistantsTitle: "Assistants",
  assistantsHint: "Hint",
  pickStaffAssistantLabel: "Pick",
  addStaffAssistantSubmit: "Add",
  staffAssistantPlaceholder: "Choose…",
  pickStudentAssistantLabel: "Student",
  studentAssistantMinHint: "Min",
  assistantsSave: "Save",
  assistantsSaved: "Saved",
  assistantsError: "Error",
  assistantsScheduleOverlap: "Overlap",
  removeAssistantAria: "Remove",
  assistantBadgeTeacher: "Teacher",
  assistantBadgeStudent: "Student",
  assistantBadgePortalAssistant: "Staff",
  externalOpenButton: "External",
  externalModalTitle: "External",
  externalTitle: "External",
  externalHint: "Hint",
  externalNameLabel: "Name",
  externalNamePlaceholder: "Name",
  externalAdd: "Add",
  externalSave: "Save",
  externalSaved: "Saved",
  externalError: "Error",
  removeExternalAria: "Remove",
} as const;

const assignedListDict = {
  heading: "Assigned now",
  leadBadge: "Lead",
  assistantBadge: "Asst.",
  assistantBadgeTeacher: "Teacher",
  assistantBadgeStudent: "Student",
  assistantBadgePortalAssistant: "Staff",
  externalBadge: "External",
  empty: "Empty",
  openProfileAria: "Open {name}",
  phoneLabel: "Phone",
  documentLabel: "Document",
  emailLabel: "Email",
} as const;

describe("AcademicSectionTeachersPanel", () => {
  it("renders summary band and manage block heading", () => {
    render(
      <AcademicSectionTeachersPanel
        locale="en"
        sectionId="00000000-0000-4000-8000-000000000010"
        teachers={[]}
        assistantPortalStaffOptions={[]}
        initialTeacherId=""
        initialAssistants={[]}
        initialExternalAssistants={[]}
        staffDict={staffDict}
        assignedListDict={assignedListDict}
        assignedPeople={[]}
        externalLabels={[]}
      />,
    );

    expect(screen.getByRole("heading", { level: 3, name: assignedListDict.heading })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: staffDict.title })).toBeInTheDocument();
    expect(screen.getByTestId("staff-editor")).toBeInTheDocument();
  });
});

describe("AcademicSectionLearningRoutePanel", () => {
  it("renders summary and route block heading", () => {
    render(
      <AcademicSectionLearningRoutePanel
        locale="en"
        cohortId="c1"
        sectionId="s1"
        routes={[]}
        assignment={null}
        dict={{
          title: "Learning route",
          lead: "Choose a route.",
          summaryTitle: "Current assignment",
          selectLabel: "Mode",
          freeFlowOption: "Free flow",
          freeFlowHelp: "Help",
          routeHelp: "Route help",
          emptyRoutes: "Empty",
          save: "Save",
          saved: "Saved",
          error: "Error",
        }}
      />,
    );

    expect(screen.getByLabelText("Current assignment")).toBeInTheDocument();
    expect(screen.getByText("Free flow")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Learning route" })).toBeInTheDocument();
    expect(screen.getByTestId("learning-route-selector")).toBeInTheDocument();
  });
});

describe("AcademicSectionAssessmentsPanel", () => {
  it("renders summary band and two block headings", () => {
    render(
      <AcademicSectionAssessmentsPanel
        locale="en"
        cohortId="c1"
        sectionId="s1"
        canDeleteCohortAssessments={false}
        data={{ learning: [], cohort: [], activeEnrollmentCount: 3 }}
        dict={{
          summaryTitle: "Overview",
          summaryLearningLabel: "Learning",
          summaryCohortLabel: "Cohort",
          titleLearning: "Learning tests",
          leadLearning: "Lead learning",
          titleCohort: "Cohort exams",
          leadCohort: "Lead cohort",
          tableLearning: "Learning table",
          tableCohort: "Cohort table",
          colTitle: "Title",
          colKind: "Kind",
          colMode: "Mode",
          colPassing: "Passing",
          colAttempts: "Attempts",
          colReviewed: "Reviewed",
          colAvg: "Avg",
          colPassed: "Passed",
          colCohortName: "Name",
          colDate: "Date",
          colMax: "Max",
          colPublished: "Published",
          colActions: "Actions",
          emptyLearning: "No learning",
          emptyCohort: "No cohort",
          emDash: "—",
          kind: {
            entry: "Entry",
            exit: "Exit",
            formative: "Formative",
            mini_test: "Mini",
            diagnostic: "Diagnostic",
            other: "Other",
          },
          grading: {
            numeric: "Numeric",
            pass_fail: "Pass/fail",
            diagnostic: "Diagnostic",
            rubric: "Rubric",
            manual_feedback: "Feedback",
          },
        } as never}
      />,
    );

    expect(screen.getByLabelText("Overview")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Learning tests" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Cohort exams" })).toBeInTheDocument();
  });
});

describe("AcademicSectionStudentsPanel", () => {
  it("renders active count summary and roster block", () => {
    render(
      <AcademicSectionStudentsPanel
        dict={{
          summaryTitle: "Snapshot",
          summaryActiveLabel: "Active enrollments",
          rosterTitle: "Roster",
          rosterLead: "Manage roster.",
        }}
        activeEnrollmentCount={5}
      >
        <div data-testid="roster-body" />
      </AcademicSectionStudentsPanel>,
    );

    expect(screen.getByLabelText("Snapshot")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Roster" })).toBeInTheDocument();
    expect(screen.getByTestId("roster-body")).toBeInTheDocument();
  });
});

describe("AcademicSectionPageAttendancePanel", () => {
  it("renders attendance block heading", () => {
    render(
      <AcademicSectionPageAttendancePanel
        locale="en"
        sectionId="s1"
        todayIso="2026-07-01"
        attendanceScheduleLine="Scheduled: Mon 10:00"
        attendanceAreaLead="Review attendance matrix."
        attendanceWindowOk={false}
        hasScheduleSlots
        hasEligibleAttendanceDays={false}
        attendanceMatrix={null}
        editableByDate={{}}
        dTeacherAttendance={{
          title: "Attendance",
          metaTitle: "Attendance",
          dateLabel: "Date",
          dateApply: "Apply",
          dateMinHint: "Hint",
          dateAdjustedHint: "Adjusted",
          scheduleSummaryLead: "Scheduled:",
          noEligibleClassDates: "No class days",
          noScheduleSlots: "No slots",
          matrix: {
            gridAria: "Grid",
            empty: "Empty",
            colStudent: "Student",
            cellAria: "Cell",
            excusedLetter: "E",
            cellDisabledNotEnrolledOnDate: "Not enrolled",
            cellDisabledInactive: "Inactive",
            cellDisabledExcused: "Excused",
            cellDisabledFuture: "Future",
            cellDisabledPast: "Past",
            keyboardHint: "Hint",
            keyboardHintAdmin: "Hint admin",
            editingPastDayBanner: "Past",
            datesTruncatedNote: "Truncated",
            datesTruncatedNewest: "Newest",
          },
          offlineHint: "Offline",
        } as never}
      />,
    );

    expect(screen.getByRole("heading", { name: "Attendance" })).toBeInTheDocument();
    expect(screen.getByText("Scheduled: Mon 10:00")).toBeInTheDocument();
    expect(screen.getByText("No class days")).toBeInTheDocument();
  });
});
