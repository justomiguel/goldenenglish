import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
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
});
