import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AcademicSectionShellTabs } from "@/components/organisms/AcademicSectionShellTabs";

const labels = {
  tablistAria: "Tabs",
  general: "Overview",
  generalLead: "Overview lead",
  schedule: "Schedule",
  enroll: "Enroll",
  roster: "Roster",
};

describe("AcademicSectionShellTabs", () => {
  it("shows the schedule panel when the Schedule tab is activated", async () => {
    const user = userEvent.setup();
    render(
      <AcademicSectionShellTabs
        labels={labels}
        general={<p>General body</p>}
        schedule={<p>Schedule body</p>}
        enroll={<p>Enroll body</p>}
        roster={<p>Roster body</p>}
      />,
    );

    expect(screen.getByText("Overview lead")).toBeVisible();
    expect(screen.getByText("General body")).toBeVisible();

    await user.click(screen.getByRole("tab", { name: /schedule/i }));
    expect(screen.getByText("Schedule body")).toBeVisible();
    const schedulePanel = screen.getByRole("tabpanel", { hidden: false });
    expect(schedulePanel).toHaveTextContent("Schedule body");
  });
});
