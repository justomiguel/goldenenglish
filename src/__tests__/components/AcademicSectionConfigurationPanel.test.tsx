/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AcademicSectionConfigurationPanel } from "@/components/organisms/AcademicSectionConfigurationPanel";
import type { AdminSectionPageData } from "@/lib/academics/loadAdminSectionPageData";
import type { Dictionary } from "@/types/i18n";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("@/app/[locale]/dashboard/admin/academic/sectionActions", () => ({
  updateAcademicSectionScheduleAction: vi.fn(),
}));

vi.mock("@/components/organisms/AcademicSectionFeatureFlagsEditor", () => ({
  AcademicSectionFeatureFlagsEditor: () => <div data-testid="feature-flags-editor" />,
}));
vi.mock("@/components/organisms/AcademicSectionPeriodEditor", () => ({
  AcademicSectionPeriodEditor: () => <div data-testid="period-editor" />,
}));
vi.mock("@/components/organisms/AcademicSectionCapacityEditor", () => ({
  AcademicSectionCapacityEditor: () => <div data-testid="capacity-editor" />,
}));
vi.mock("@/components/organisms/AcademicSectionMinAttendanceEditor", () => ({
  AcademicSectionMinAttendanceEditor: () => <div data-testid="min-attendance-editor" />,
}));
vi.mock("@/components/organisms/AcademicSectionRoomLabelEditor", () => ({
  AcademicSectionRoomLabelEditor: () => <div data-testid="room-label-editor" />,
}));

type PageDict = Dictionary["dashboard"]["academicSectionPage"];

/** Mirrors `dashboard.academicSectionPage.settingsSummary` in en.json */
const settingsSummaryDict = {
  title: "Section settings",
  lead: "Period, room, capacity, and features for this section.",
  groups: {
    class: { title: "Class" },
    capacity: { title: "Capacity & attendance" },
    features: { title: "Features" },
  },
} satisfies PageDict["settingsSummary"];

const scheduleDict = {
  scheduleTitle: "Schedule",
  scheduleHint: "Hint",
  scheduleAddSlot: "Add slot",
  scheduleDayLabel: "Day",
  scheduleStartLabel: "Start",
  scheduleEndLabel: "End",
  scheduleInvalid: "Invalid schedule",
  saveSchedule: "Save schedule",
  saveScheduleError: "Could not save",
  unsavedBadge: "Unsaved changes",
  selectedBlockTitle: "Selected block",
  editTimes: "Edit times",
  deleteBlock: "Delete block",
  closeInspectorAria: "Close block editor",
  overlapError: "Overlap",
  createHint: "Create hint",
  gridAria: "Weekly class schedule",
  weekdays: {
    sun: "Sun",
    mon: "Mon",
    tue: "Tue",
    wed: "Wed",
    thu: "Thu",
    fri: "Fri",
    sat: "Sat",
  },
} satisfies PageDict["scheduleEditor"];

const sectionStub: AdminSectionPageData["section"] = {
  id: "section-1",
  name: "Section",
  cohortId: "cohort-1",
  teacherId: "teacher-1",
  archivedAt: null,
  startsOn: "2026-01-01",
  endsOn: "2026-12-31",
  roomLabel: null,
  effectiveMaxStudents: 10,
  siteDefaultMax: 10,
  activeEnrollmentCount: 0,
  enrollmentFeeAmount: 0,
  monthlyFeeChargeMode: "prorate_by_classes",
  allowAdvanceMonthlyPayment: false,
  minAttendancePercentOverride: null,
  siteDefaultMinAttendancePercent: 75,
  requiresEvaluationsToPass: false,
  usesLearningRoute: false,
};

const emptyFeatureFlags = {} as PageDict["featureFlags"];
const emptyPeriod = {} as PageDict["period"];
const emptyCapacity = {} as PageDict["capacity"];
const emptyMinAttendance = {} as PageDict["minAttendance"];
const emptyRoomLabel = {} as PageDict["roomLabel"];

describe("AcademicSectionConfigurationPanel", () => {
  it("renders the settings summary title and the week grid", () => {
    render(
      <AcademicSectionConfigurationPanel
        locale="en"
        sectionId="section-1"
        section={sectionStub}
        slots={[{ dayOfWeek: 1, startTime: "08:00", endTime: "09:00" }]}
        settingsSummaryDict={settingsSummaryDict}
        featureFlagsDict={emptyFeatureFlags}
        periodDict={emptyPeriod}
        capacityDict={emptyCapacity}
        minAttendanceDict={emptyMinAttendance}
        roomLabelDict={emptyRoomLabel}
        scheduleEditorDict={scheduleDict}
      />,
    );

    expect(screen.getByRole("heading", { level: 2, name: settingsSummaryDict.title })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: scheduleDict.scheduleTitle })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: settingsSummaryDict.groups.class.title })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: settingsSummaryDict.groups.capacity.title }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: settingsSummaryDict.groups.features.title }),
    ).toBeInTheDocument();
    expect(document.getElementById("section-configuration-settings-heading")).toBeTruthy();
    expect(document.getElementById("section-configuration-schedule-heading")).toBeTruthy();
    expect(screen.getByLabelText("Weekly class schedule")).toBeInTheDocument();
  });
});
