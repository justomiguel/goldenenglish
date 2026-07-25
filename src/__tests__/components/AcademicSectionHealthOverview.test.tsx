// REGRESSION CHECK: Section hub health must stay lean — attendance + payments
// charts only; optional flag chips; no engagement/tasks/capacity wall.
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AcademicSectionHealthOverview } from "@/components/organisms/AcademicSectionHealthOverview";
import type { AdminSectionHealthSnapshot } from "@/types/adminSectionHealth";

const dict = {
  title: "Section health",
  lead: "Health lead",
  windowHint: "Last 30 days",
  na: "n/a",
  summaryStrip: "{students} students · capacity {capacity} · attendance {attendance}",
  summaryScreenReader: "Students {students}, capacity {capacity}, attendance {attendance}",
  segPresent: "Present",
  segAbsent: "Absent",
  segLate: "Late",
  segExcused: "Excused",
  segNotOpened: "Not opened",
  segOpened: "Opened",
  segCompleted: "Completed",
  segCapacityUsed: "Used",
  segCapacityFree: "Free",
  segPaymentsDebt: "With debt",
  segPaymentsClear: "Clear",
  segAssessmentsPublished: "Published",
  segAssessmentsPending: "Pending",
  segReadinessSupport: "Needs support",
  segReadinessOverride: "Override",
  chartAttendanceTitle: "Attendance mix",
  chartTasksTitle: "Tasks",
  chartCapacityTitle: "Capacity",
  chartPaymentsTitle: "Payments",
  chartEngagementTitle: "Engagement",
  chartAssessmentsTitle: "Assessments",
  chartReadinessTitle: "Readiness",
  chartEmpty: "No data",
  chartHelpAria: "Explain chart",
  chartHelpClose: "Close",
  chartHelpAttendanceBody: "Attendance help",
  chartHelpTasksBody: "Tasks help",
  chartHelpCapacityBody: "Capacity help",
  chartHelpPaymentsBody: "Payments help",
  chartHelpEngagementBody: "Engagement help",
  chartHelpAssessmentsBody: "Assessments help",
  chartHelpReadinessBody: "Readiness help",
  chartEngagementPoints: "Points",
  chartEngagementMaterial: "Material views",
  chartEngagementLearning: "Learning events",
  flagMissingEntry: "Missing entry assessment",
  flagMissingExit: "Missing exit assessment",
  flagMissingObjectives: "Missing objectives",
};

const snapshot: AdminSectionHealthSnapshot = {
  activeStudents: 10,
  effectiveMaxStudents: 20,
  capacityUtilizationPct: 50,
  attendance: { present: 8, absent: 1, late: 1, excused: 0, ratePct: 90 },
  tasks: {
    instanceCount: 3,
    progressRows: 10,
    notOpened: 2,
    opened: 3,
    completed: 5,
    openOrDonePct: 80,
    completedPct: 50,
  },
  payments: { activeWithDebt: 2, activeWithoutDebt: 8 },
  engagement: {
    sumEngagementPoints: 100,
    materialViews30d: 40,
    learningEvents30d: 20,
  },
  assessments: {
    cohortAssessmentCount: 2,
    publishedGradeRows: 5,
    expectedSlots: 20,
    coveragePct: 25,
  },
  learningRoute: {
    mode: "route",
    routeTitle: "A1 Path",
    plannedSteps: 4,
    health: {
      missingEntryAssessment: true,
      missingExitAssessment: false,
      missingObjectives: true,
      needsSupportCount: 1,
      teacherOverrideCount: 0,
    },
  },
};

describe("AcademicSectionHealthOverview", () => {
  it("renders attendance and payments charts but not the dropped hub charts", () => {
    render(
      <AcademicSectionHealthOverview
        locale="en"
        snapshot={snapshot}
        dict={dict as never}
        featureFlags={{ requiresEvaluationsToPass: true, usesLearningRoute: true }}
      />,
    );

    expect(screen.getByText("Attendance mix")).toBeInTheDocument();
    expect(screen.getByText("Payments")).toBeInTheDocument();
    expect(screen.queryByText("Tasks")).not.toBeInTheDocument();
    expect(screen.queryByText("Capacity")).not.toBeInTheDocument();
    expect(screen.queryByText("Engagement")).not.toBeInTheDocument();
    expect(screen.queryByText("Assessments")).not.toBeInTheDocument();
    expect(screen.queryByText("Readiness")).not.toBeInTheDocument();
  });

  it("shows evaluation and route flag chips when flags are on", () => {
    render(
      <AcademicSectionHealthOverview
        locale="en"
        snapshot={snapshot}
        dict={dict as never}
        featureFlags={{ requiresEvaluationsToPass: true, usesLearningRoute: true }}
      />,
    );
    expect(screen.getByText("Missing entry assessment")).toBeInTheDocument();
    expect(screen.getByText("Missing objectives")).toBeInTheDocument();
    expect(screen.getByText("A1 Path")).toBeInTheDocument();
  });
});
