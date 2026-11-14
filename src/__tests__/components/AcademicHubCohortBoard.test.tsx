// REGRESSION CHECK: Active opens selected. The current cohort stays first and marked. Archived stays on its own tab.
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AcademicHubCohortBoard } from "@/components/organisms/AcademicHubCohortBoard";

const boardDict = {
  currentTitle: "Current cohort",
  currentLead: "Lead current",
  activeTitle: "Active",
  activeLead: "Lead active",
  archivedTitle: "Archived",
  archivedLead: "Lead archived",
  emptyActive: "No active",
  emptyArchived: "No archived",
  emptyAll: "Empty all",
  noCurrentBanner: "Pick a current cohort",
  tabs: {
    tablistAria: "Cohort tabs",
    current: "Current",
    active: "Active",
    archived: "Archived",
    emptyCurrent: "No current cohort",
  },
};

const rowLabels = {
  currentBadge: "Current",
  statusActive: "Active",
  setAsCurrent: "Set as current",
  open: "Open",
  archivedBadge: "Archived",
  openCohortTitle: "Open cohort",
};

describe("AcademicHubCohortBoard", () => {
  it("renders empty state when there are no cohorts", () => {
    render(
      <AcademicHubCohortBoard
        locale="en"
        current={null}
        active={[]}
        archived={[]}
        boardDict={boardDict}
        rowLabels={rowLabels}
        hasAnyCohort={false}
      />,
    );
    expect(screen.getByText("Empty all")).toBeInTheDocument();
  });

  it("renders no-current banner when cohorts exist but none is current", () => {
    render(
      <AcademicHubCohortBoard
        locale="en"
        current={null}
        active={[
          {
            id: "00000000-0000-4000-8000-000000000001",
            name: "Spring",
            is_current: false,
            archived_at: null,
          },
        ]}
        archived={[]}
        boardDict={boardDict}
        rowLabels={rowLabels}
        hasAnyCohort
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Pick a current cohort");
    expect(screen.getByText("Spring")).toBeInTheDocument();
  });

  it("puts the current cohort first on Active and keeps archived on the other tab", async () => {
    const user = userEvent.setup();
    render(
      <AcademicHubCohortBoard
        locale="en"
        current={{
          id: "00000000-0000-4000-8000-000000000010",
          name: "Winter",
          is_current: true,
          archived_at: null,
        }}
        active={[
          {
            id: "00000000-0000-4000-8000-000000000001",
            name: "Spring",
            is_current: false,
            archived_at: null,
          },
        ]}
        archived={[
          {
            id: "00000000-0000-4000-8000-000000000002",
            name: "Old",
            is_current: false,
            archived_at: "2025-01-01T00:00:00.000Z",
          },
        ]}
        boardDict={boardDict}
        rowLabels={rowLabels}
        hasAnyCohort
      />,
    );

    expect(screen.getByRole("tab", { name: "Active" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Archived" })).toHaveAttribute("aria-selected", "false");
    expect(screen.queryByRole("tab", { name: "Current" })).not.toBeInTheDocument();

    const marked = screen.getByRole("region", { name: "Current cohort" });
    expect(marked).toHaveTextContent("Winter");
    expect(marked).toHaveTextContent("Current");
    expect(marked).not.toHaveTextContent("Spring");

    const activePanel = marked.closest("[role='tabpanel']");
    const panelText = activePanel?.textContent ?? "";
    expect(panelText.indexOf("Winter")).toBeGreaterThanOrEqual(0);
    expect(panelText.indexOf("Winter")).toBeLessThan(panelText.indexOf("Spring"));

    const archivedPanel = document.getElementById(
      screen.getByRole("tab", { name: "Archived" }).getAttribute("aria-controls") ?? "",
    );
    expect(archivedPanel).toHaveAttribute("hidden");
    expect(archivedPanel).toHaveTextContent("Old");

    await user.click(screen.getByRole("tab", { name: "Archived" }));
    expect(archivedPanel).not.toHaveAttribute("hidden");
    expect(marked.closest("[role='tabpanel']")).toHaveAttribute("hidden");
  });
});
