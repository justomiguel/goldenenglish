import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AcademicSectionShellTabs } from "@/components/organisms/AcademicSectionShellTabs";

const labels = {
  tablistAria: "Tabs",
  general: "Overview",
  generalLead: "Overview lead",
  schedule: "Schedule",
  fees: "Fees",
  feesLead: "Fees lead",
  attendance: "Attendance",
  attendanceLead: "Attendance lead",
  enroll: "Enroll",
  roster: "Roster",
};

const renderShell = () =>
  render(
    <AcademicSectionShellTabs
      labels={labels}
      general={<p>General body</p>}
      schedule={<p>Schedule body</p>}
      fees={<p>Fees body</p>}
      attendance={<p>Attendance body</p>}
      enroll={<p>Enroll body</p>}
      roster={<p>Roster body</p>}
    />,
  );

describe("AcademicSectionShellTabs", () => {
  // REGRESSION CHECK: tabs are the public surface of the section workspace; if a
  // tab disappears or changes id, admin features mounted on it (fees, schedule,
  // enroll, roster) become unreachable.
  it("shows the schedule panel when the Schedule tab is activated", async () => {
    const user = userEvent.setup();
    renderShell();

    expect(screen.getByText("Overview lead")).toBeVisible();
    expect(screen.getByText("General body")).toBeVisible();

    await user.click(screen.getByRole("tab", { name: /schedule/i }));
    expect(screen.getByText("Schedule body")).toBeVisible();
    const schedulePanel = screen.getByRole("tabpanel", { hidden: false });
    expect(schedulePanel).toHaveTextContent("Schedule body");
  });

  it("renders the Fees tab with its lead and switches to its body", async () => {
    const user = userEvent.setup();
    renderShell();

    const feesTab = screen.getByRole("tab", { name: /fees/i });
    expect(feesTab).toBeInTheDocument();

    await user.click(feesTab);
    expect(screen.getByText("Fees lead")).toBeVisible();
    expect(screen.getByText("Fees body")).toBeVisible();
    const feesPanel = screen.getByRole("tabpanel", { hidden: false });
    expect(feesPanel).toHaveTextContent("Fees body");
  });

  it("renders attendance as a first-class section tab", async () => {
    const user = userEvent.setup();
    renderShell();

    const attendanceTab = screen.getByRole("tab", { name: /attendance/i });
    expect(attendanceTab).toBeInTheDocument();

    await user.click(attendanceTab);
    expect(screen.getByText("Attendance lead")).toBeVisible();
    expect(screen.getByText("Attendance body")).toBeVisible();
    const attendancePanel = screen.getByRole("tabpanel", { hidden: false });
    expect(attendancePanel).toHaveTextContent("Attendance body");
  });
});
