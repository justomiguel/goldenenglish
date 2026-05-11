import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  StudentPaymentsScreenTabs,
  STUDENT_PAYMENTS_TAB_HISTORY,
} from "@/components/student/StudentPaymentsScreenTabs";

describe("StudentPaymentsScreenTabs", () => {
  it("switches overview and history tab panels without unmounting both", async () => {
    const user = userEvent.setup();
    render(
      <StudentPaymentsScreenTabs
        ariaLabel="Payments test"
        overviewTabLabel="Overview"
        historyTabLabel="History"
        overview={<div data-testid="ov-panel">Ov</div>}
        history={<div data-testid="hi-panel">Hi</div>}
      />,
    );
    expect(screen.getByRole("tablist", { name: "Payments test" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveAttribute("aria-selected", "true");
    const hist = screen.getByRole("tab", { name: "History" });

    await user.click(hist);
    expect(hist).toHaveAttribute("aria-selected", "true");
    const ovPanel = document.querySelector('[id*="panel-overview"]');
    const hiPanel = document.querySelector(`[id*="panel-${STUDENT_PAYMENTS_TAB_HISTORY}"]`);
    expect(ovPanel).not.toBeNull();
    expect(hiPanel).not.toBeNull();
    expect(ovPanel).toHaveAttribute("hidden");
    expect(hiPanel).not.toHaveAttribute("hidden");
    expect(screen.getByTestId("hi-panel")).toBeInTheDocument();
  });
});
