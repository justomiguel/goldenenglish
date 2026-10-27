import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { GradingForm } from "@/components/molecules/GradingForm";
import type { RubricDimensionDef } from "@/types/rubricDimensions";

// REGRESSION CHECK: GradingForm must render discrete 1..10 buttons for 1–10 rubric dimensions
// instead of falling back to a range slider when span <= 10.

const dimensions: RubricDimensionDef[] = [
  { key: "speaking", label: "Speaking", scaleMin: 1, scaleMax: 10 },
];

const rubricDict = {
  scoreLabel: "Final score",
  autoHint: "Suggested: {value}",
  syncFromRubric: "Sync from rubric",
  feedbackLabel: "Teacher feedback",
};

const chipDict = {
  aria: "Quick insert phrases",
  phrases: ["Great participation."],
};

function Harness() {
  const [rubric, setRubric] = useState<Record<string, number>>({ speaking: 6 });
  const [scoreStr, setScoreStr] = useState("6");
  const [scoreLocked, setScoreLocked] = useState(false);
  const [feedback, setFeedback] = useState("");
  return (
    <GradingForm
      maxScore={10}
      dimensions={dimensions}
      rubric={rubric}
      setRubric={setRubric}
      scoreStr={scoreStr}
      setScoreStr={setScoreStr}
      scoreLocked={scoreLocked}
      setScoreLocked={setScoreLocked}
      feedback={feedback}
      setFeedback={setFeedback}
      onInsertFeedback={vi.fn()}
      rubricDict={rubricDict}
      chipDict={chipDict}
    />
  );
}

describe("GradingForm 1–10 rubric buttons", () => {
  it("renders buttons 1 through 10 and updates the rubric value and suggested score on tap", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const group = screen.getByRole("group", { name: "Speaking" });
    const buttons = within(group).getAllByRole("button");
    expect(buttons).toHaveLength(10);
    expect(buttons.map((b) => b.textContent)).toEqual(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]);
    expect(within(group).getByRole("button", { name: "6" })).toHaveAttribute("aria-pressed", "true");

    await user.click(within(group).getByRole("button", { name: "10" }));

    expect(within(group).getByRole("button", { name: "10" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("10/10")).toBeInTheDocument();
    expect(screen.getByLabelText(/Final score/)).toHaveValue(10);
  });
});
