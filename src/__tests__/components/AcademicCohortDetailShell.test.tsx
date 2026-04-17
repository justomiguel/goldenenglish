import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AcademicCohortDetailShell } from "@/components/organisms/AcademicCohortDetailShell";

const labels = {
  tablistAria: "Cohort workspace",
  overview: "Overview",
  overviewLead: "Headline metrics and lifecycle.",
  sections: "Sections",
};

describe("AcademicCohortDetailShell", () => {
  it("selects overview by default and shows overview lead", () => {
    render(
      <AcademicCohortDetailShell
        labels={labels}
        overview={<div>Lifecycle content</div>}
        sections={<div>Sections content</div>}
      />,
    );
    expect(screen.getByRole("tablist", { name: labels.tablistAria })).toBeInTheDocument();
    expect(screen.getByText(labels.overviewLead)).toBeInTheDocument();
    expect(screen.getByText("Lifecycle content")).toBeInTheDocument();
    const overviewTab = screen.getByRole("tab", { name: labels.overview });
    expect(overviewTab).toHaveAttribute("aria-selected", "true");
  });

  it("starts on sections when defaultTab is sections", async () => {
    const user = userEvent.setup();
    render(
      <AcademicCohortDetailShell
        defaultTab="sections"
        labels={labels}
        overview={<div>Overview only</div>}
        sections={<div>Sections grid</div>}
      />,
    );
    expect(screen.getByRole("tab", { name: labels.sections })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Sections grid")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: labels.overview }));
    expect(screen.getByText("Overview only")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: labels.overview })).toHaveAttribute("aria-selected", "true");
  });
});
