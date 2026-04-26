import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AcademicSectionShellTabs } from "@/components/organisms/AcademicSectionShellTabs";

const labels = {
  tablistAria: "Tabs",
  groupListAria: "Areas",
  groupSetup: "Setup",
  groupPathAndFees: "Path & money",
  groupClassRoster: "Class",
  general: "Overview",
  generalLead: "Overview lead",
  configuration: "Configuration",
  configurationLead: "Configuration lead",
  teachers: "Teachers",
  teachersLead: "Teachers lead",
  learningRoute: "Learning route",
  learningRouteLead: "Learning route lead",
  fees: "Fees",
  feesLead: "Fees lead",
  attendance: "Attendance",
  attendanceLead: "Attendance lead",
  students: "Students",
  studentsLead: "Students lead",
};

const renderShell = () =>
  render(
    <AcademicSectionShellTabs
      labels={labels}
      general={<p>General body</p>}
      configuration={<p>Configuration body</p>}
      teachers={<p>Teachers body</p>}
      learningRoute={<p>Learning route body</p>}
      fees={<p>Fees body</p>}
      attendance={<p>Attendance body</p>}
      students={
        <>
          <p>Enroll body</p>
          <p>Roster body</p>
        </>
      }
    />,
  );

const areaNav = () => screen.getByRole("navigation", { name: /areas/i });

describe("AcademicSectionShellTabs", () => {
  // REGRESSION CHECK: tabs are the public surface of the section workspace; if a
  // tab disappears or changes id, admin features mounted on it (fees,
  // configuration, students) become unreachable.
  it("switches to the first tab in an area when choosing a top group", async () => {
    const user = userEvent.setup();
    renderShell();
    await user.click(within(areaNav()).getByRole("button", { name: /path & money/i }));
    expect(screen.getByText("Learning route lead")).toBeVisible();
  });

  it("shows the configuration panel when the Configuration tab is activated", async () => {
    const user = userEvent.setup();
    renderShell();

    expect(screen.getByText("Overview lead")).toBeVisible();
    expect(screen.getByText("General body")).toBeVisible();

    await user.click(screen.getByRole("tab", { name: /configuration/i }));
    expect(screen.getByText("Configuration lead")).toBeVisible();
    expect(screen.getByText("Configuration body")).toBeVisible();
    const panel = screen.getByRole("tabpanel", { hidden: false });
    expect(panel).toHaveTextContent("Configuration body");
  });

  it("renders the Teachers tab with its lead", async () => {
    const user = userEvent.setup();
    renderShell();

    await user.click(screen.getByRole("tab", { name: /teachers/i }));
    expect(screen.getByText("Teachers lead")).toBeVisible();
    expect(screen.getByText("Teachers body")).toBeVisible();
  });

  it("renders the Fees tab with its lead and switches to its body", async () => {
    const user = userEvent.setup();
    renderShell();
    await user.click(within(areaNav()).getByRole("button", { name: /path & money/i }));

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
    await user.click(within(areaNav()).getByRole("button", { name: /^class$/i }));

    const attendanceTab = screen.getByRole("tab", { name: /attendance/i });
    expect(attendanceTab).toBeInTheDocument();

    await user.click(attendanceTab);
    expect(screen.getByText("Attendance lead")).toBeVisible();
    expect(screen.getByText("Attendance body")).toBeVisible();
    const attendancePanel = screen.getByRole("tabpanel", { hidden: false });
    expect(attendancePanel).toHaveTextContent("Attendance body");
  });

  it("renders learning route as a first-class section tab", async () => {
    const user = userEvent.setup();
    renderShell();
    await user.click(within(areaNav()).getByRole("button", { name: /path & money/i }));
    await user.click(screen.getByRole("tab", { name: /learning route/i }));
    expect(screen.getByText("Learning route lead")).toBeVisible();
    expect(screen.getByText("Learning route body")).toBeVisible();
  });

  it("merges enrollment and roster into the Students tab with both panels", async () => {
    const user = userEvent.setup();
    renderShell();
    await user.click(within(areaNav()).getByRole("button", { name: /^class$/i }));
    await user.click(screen.getByRole("tab", { name: /^students$/i }));
    expect(screen.getByText("Students lead")).toBeVisible();
    expect(screen.getByText("Enroll body")).toBeVisible();
    expect(screen.getByText("Roster body")).toBeVisible();
    const panel = screen.getByRole("tabpanel", { hidden: false });
    expect(panel).toHaveTextContent("Enroll body");
    expect(panel).toHaveTextContent("Roster body");
  });
});
