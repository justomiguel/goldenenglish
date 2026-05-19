import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { dictEn } from "@/test/dictEn";
import { ParentAttendancePwaScreen } from "@/components/pwa/organisms/ParentAttendancePwaScreen";
import type { ParentRecentAttendanceModel } from "@/lib/parent/loadParentRecentAttendance";
import { PARENT_ATTENDANCE_OK_MIN_PERCENT } from "@/lib/parent/buildParentHomePillarSnapshot";

vi.mock("@/components/pwa/organisms/PortalCalendarNarrowAgenda", () => ({
  PortalCalendarNarrowAgenda: () => <div data-testid="narrow-agenda" />,
}));

vi.mock("@/components/organisms/PortalCalendarAssistPanel", () => ({
  PortalCalendarAssistPanel: () => null,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/en/dashboard/parent/calendar",
}));

const mockUseAppSurface = vi.fn(() => "web-desktop" as const);
vi.mock("@/hooks/useAppSurface", () => ({
  useAppSurface: () => mockUseAppSurface(),
}));

const wardOptions = [{ studentId: "s1", displayName: "Ana Beta" }];
const parentLabels = dictEn.dashboard.parent;

const model: ParentRecentAttendanceModel = {
  children: [{ studentId: "s1", studentName: "Ana Beta" }],
  requiredMinPercent: PARENT_ATTENDANCE_OK_MIN_PERCENT,
  sectionSummaries: [
    {
      studentId: "s1",
      studentName: "Ana Beta",
      sectionId: "sec-a",
      sectionName: "Kids A",
      monthPercent: 50,
      sessionsThisMonth: 2,
      requiredMinPercent: PARENT_ATTENDANCE_OK_MIN_PERCENT,
      level: "attention",
    },
  ],
  marks: [
    {
      markId: "1",
      attendedOn: "2026-05-10",
      status: "present",
      studentId: "s1",
      studentName: "Ana Beta",
      sectionId: "sec-a",
      sectionName: "Kids A",
    },
    {
      markId: "2",
      attendedOn: "2026-05-08",
      status: "absent",
      studentId: "s1",
      studentName: "Ana Beta",
      sectionId: "sec-a",
      sectionName: "Kids A",
    },
  ],
};

describe("ParentAttendancePwaScreen", () => {
  it("shows section percent in card, toggles latest records, opens schedule modal", async () => {
    const user = userEvent.setup();
    const labels = dictEn.dashboard.parent.attendancePwa;

    render(
      <ParentAttendancePwaScreen
        locale="en"
        model={model}
        labels={labels}
        wardOptions={wardOptions}
        selectedStudentId="s1"
        wardPickerLabel={parentLabels.wardPickerLabel}
        wardPickerHint={parentLabels.wardPickerHint}
        portalCalendarDict={dictEn.dashboard.portalCalendar}
        scheduleDict={{
          legend: dictEn.dashboard.portalCalendar.legend,
          specialTypes: dictEn.dashboard.portalCalendar.specialTypes,
          schedule: dictEn.dashboard.portalCalendar.schedule,
        }}
        events={[]}
        feedUrl={null}
      />,
    );

    expect(screen.getByRole("heading", { name: labels.title })).toBeInTheDocument();
    expect(screen.getByText(parentLabels.wardPickerLabel)).toBeInTheDocument();
    expect(screen.getByText("Ana Beta")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByText(labels.sectionBelowTarget)).toBeInTheDocument();
    expect(screen.queryByText(labels.statusPresent)).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: labels.recentMarksExpandAria.replace("{count}", "2").replace("{section}", "Kids A"),
      }),
    );
    expect(screen.getByText(labels.statusPresent)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: labels.openSchedule }));
    expect(screen.getByRole("dialog", { name: labels.scheduleModalTitle })).toBeVisible();
    expect(screen.getByTestId("narrow-agenda")).toBeInTheDocument();
  });

  it("shows ward picker and filters sections when several students are linked", () => {
    const labels = dictEn.dashboard.parent.attendancePwa;
    const multiWardOptions = [
      { studentId: "s1", displayName: "Ana Beta" },
      { studentId: "s2", displayName: "Bruno Alpha" },
    ];
    const multiModel: ParentRecentAttendanceModel = {
      ...model,
      children: [
        { studentId: "s1", studentName: "Ana Beta" },
        { studentId: "s2", studentName: "Bruno Alpha" },
      ],
      sectionSummaries: [
        ...(model.sectionSummaries ?? []),
        {
          studentId: "s2",
          studentName: "Bruno Alpha",
          sectionId: "sec-b",
          sectionName: "Kids B",
          monthPercent: 80,
          sessionsThisMonth: 3,
          requiredMinPercent: 75,
          level: "ok",
        },
      ],
    };

    const { rerender } = render(
      <ParentAttendancePwaScreen
        locale="en"
        model={multiModel}
        labels={labels}
        wardOptions={multiWardOptions}
        selectedStudentId="s1"
        wardPickerLabel={parentLabels.wardPickerLabel}
        wardPickerHint={parentLabels.wardPickerHint}
        portalCalendarDict={dictEn.dashboard.portalCalendar}
        scheduleDict={{
          legend: dictEn.dashboard.portalCalendar.legend,
          specialTypes: dictEn.dashboard.portalCalendar.specialTypes,
          schedule: dictEn.dashboard.portalCalendar.schedule,
        }}
        events={[]}
        feedUrl={null}
      />,
    );

    expect(screen.getByLabelText(parentLabels.wardPickerLabel)).toBeInTheDocument();
    expect(screen.getByText("Kids A")).toBeInTheDocument();
    expect(screen.queryByText("Kids B")).not.toBeInTheDocument();

    rerender(
      <ParentAttendancePwaScreen
        locale="en"
        model={multiModel}
        labels={labels}
        wardOptions={multiWardOptions}
        selectedStudentId="s2"
        wardPickerLabel={parentLabels.wardPickerLabel}
        wardPickerHint={parentLabels.wardPickerHint}
        portalCalendarDict={dictEn.dashboard.portalCalendar}
        scheduleDict={{
          legend: dictEn.dashboard.portalCalendar.legend,
          specialTypes: dictEn.dashboard.portalCalendar.specialTypes,
          schedule: dictEn.dashboard.portalCalendar.schedule,
        }}
        events={[]}
        feedUrl={null}
      />,
    );
    expect(screen.queryByText("Kids A")).not.toBeInTheDocument();
    expect(screen.getByText("Kids B")).toBeInTheDocument();
  });

  it("shows schedule FAB on narrow parent surface", async () => {
    const user = userEvent.setup();
    mockUseAppSurface.mockReturnValue("pwa-mobile");
    const labels = dictEn.dashboard.parent.attendancePwa;

    render(
      <ParentAttendancePwaScreen
        locale="en"
        model={model}
        labels={labels}
        wardOptions={wardOptions}
        selectedStudentId="s1"
        wardPickerLabel={parentLabels.wardPickerLabel}
        wardPickerHint={parentLabels.wardPickerHint}
        portalCalendarDict={dictEn.dashboard.portalCalendar}
        scheduleDict={{
          legend: dictEn.dashboard.portalCalendar.legend,
          specialTypes: dictEn.dashboard.portalCalendar.specialTypes,
          schedule: dictEn.dashboard.portalCalendar.schedule,
        }}
        events={[]}
        feedUrl={null}
      />,
    );

    const scheduleFab = screen.getByRole("button", { name: labels.openSchedule });
    expect(scheduleFab).toHaveClass("fixed");

    await user.click(screen.getByRole("button", { name: labels.openSchedule }));
    expect(screen.getByRole("dialog", { name: labels.scheduleModalTitle })).toBeVisible();
    mockUseAppSurface.mockReturnValue("web-desktop");
  });
});
