import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AdminGlossaryScreen } from "@/components/organisms/AdminGlossaryScreen";
import en from "@/dictionaries/en.json";

describe("AdminGlossaryScreen", () => {
  it("renders page chrome and glossary entries", () => {
    render(
      <AdminGlossaryScreen
        pageDict={en.dashboard.adminGlossaryPage}
        glossaryDict={en.dashboard.adminHelpGlossary}
      />,
    );

    expect(screen.getByRole("heading", { level: 1, name: en.dashboard.adminGlossaryPage.title })).toBeInTheDocument();
    expect(screen.getByText(en.dashboard.adminGlossaryPage.lead)).toBeInTheDocument();
    expect(screen.getByText("Cohort", { selector: "summary span" })).toBeInTheDocument();
  });
});
