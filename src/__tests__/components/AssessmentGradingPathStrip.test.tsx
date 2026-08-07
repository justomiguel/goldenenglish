import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AssessmentGradingPathStrip } from "@/components/molecules/AssessmentGradingPathStrip";

const labels = {
  stepCreate: "Create",
  stepStudent: "Student",
  stepGrade: "Grade",
  stepPublish: "Publish",
  stripAria: "Grading path",
};

function renderStrip(
  currentStep: 1 | 2 | 3 | 4,
  countsText?: string | null,
) {
  return render(
    <AssessmentGradingPathStrip
      currentStep={currentStep}
      labels={labels}
      countsText={countsText}
    />,
  );
}

function stepByLabel(name: string) {
  return screen.getByRole("listitem", { name });
}

describe("AssessmentGradingPathStrip", () => {
  it("marks earlier steps done, current step highlighted, and later steps future when currentStep is 2", () => {
    renderStrip(2);

    expect(screen.getByRole("list", { name: labels.stripAria })).toBeInTheDocument();
    expect(stepByLabel(labels.stepCreate)).toHaveAttribute("data-path-state", "done");
    expect(stepByLabel(labels.stepStudent)).toHaveAttribute("data-path-state", "current");
    expect(stepByLabel(labels.stepGrade)).toHaveAttribute("data-path-state", "future");
    expect(stepByLabel(labels.stepPublish)).toHaveAttribute("data-path-state", "future");
  });

  it("shows counts text when provided and hides it when omitted", () => {
    const { rerender } = renderStrip(2, "2 published · 1 draft · 3 pending");
    expect(screen.getByText("2 published · 1 draft · 3 pending")).toBeInTheDocument();

    rerender(
      <AssessmentGradingPathStrip currentStep={2} labels={labels} countsText={null} />,
    );
    expect(screen.queryByText("2 published · 1 draft · 3 pending")).not.toBeInTheDocument();
  });

  it("renders arrow separators between steps", () => {
    renderStrip(1);
    const separators = screen.getAllByText("→");
    expect(separators).toHaveLength(3);
    separators.forEach((separator) => {
      expect(separator).toHaveAttribute("aria-hidden", "true");
    });
  });

  it("uses sticky positioning on the outer wrapper", () => {
    renderStrip(2);
    const list = screen.getByRole("list", { name: labels.stripAria });
    const wrapper = list.parentElement;
    expect(wrapper).toHaveClass("sticky", "top-0", "z-10", "bg-[var(--color-background)]");
  });
});
