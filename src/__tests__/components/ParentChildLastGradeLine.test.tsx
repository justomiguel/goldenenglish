import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ParentChildLastGradeLine } from "@/components/parent/ParentChildLastGradeLine";

const labels = {
  summaryLastGrade: "Latest grade",
  summaryLastGradeValue: "{score} / {max} · {assessment} ({date})",
  summaryLastGradeEmpty: "No grades yet",
};

describe("ParentChildLastGradeLine", () => {
  it("renders empty copy when no grade", () => {
    render(<ParentChildLastGradeLine locale="en" grade={null} labels={labels} />);
    expect(screen.getByText("Latest grade")).toBeInTheDocument();
    expect(screen.getByText("No grades yet")).toBeInTheDocument();
  });

  it("formats score, max, name and date", () => {
    render(
      <ParentChildLastGradeLine
        locale="en"
        grade={{
          score: 8.5,
          maxScore: 10,
          assessmentName: "Unit 3",
          assessmentOn: "2026-03-04",
        }}
        labels={labels}
      />,
    );
    const value = screen.getByText(/Unit 3/);
    expect(value.textContent).toContain("8.5 / 10");
    expect(value.textContent).toContain("Unit 3");
  });
});
