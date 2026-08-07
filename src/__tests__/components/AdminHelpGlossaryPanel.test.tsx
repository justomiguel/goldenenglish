import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminHelpGlossaryPanel } from "@/components/dashboard/AdminHelpGlossaryPanel";
import en from "@/dictionaries/en.json";

describe("AdminHelpGlossaryPanel", () => {
  const dict = en.dashboard.adminHelpGlossary;

  it("renders hierarchy intro and grouped term titles", () => {
    render(<AdminHelpGlossaryPanel dict={dict} />);

    expect(screen.getByText(dict.hierarchyTitle)).toBeInTheDocument();
    expect(screen.getByText("Cohort", { selector: "summary span" })).toBeInTheDocument();
    expect(screen.getByText("Guardian / tutor", { selector: "summary span" })).toBeInTheDocument();
    expect(screen.getByText("Promotion", { selector: "summary span" })).toBeInTheDocument();
    expect(screen.getByText(dict.groups.structure)).toBeInTheDocument();
  });

  it("expands a term and shows related links", async () => {
    const user = userEvent.setup();
    render(<AdminHelpGlossaryPanel dict={dict} />);

    const cohortSummary = screen.getByText("Cohort", { selector: "summary span" }).closest("summary");
    expect(cohortSummary).toBeTruthy();
    const cohortDetails = cohortSummary!.closest("details")!;
    await user.click(cohortSummary!);

    expect(within(cohortDetails).getByText(dict.relatedLabel)).toBeInTheDocument();
    expect(within(cohortDetails).getByRole("button", { name: "Current cohort" })).toBeInTheDocument();
  });
});
