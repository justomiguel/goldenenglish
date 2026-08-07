import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { UnderlineTabBar, type UnderlineTabItem } from "@/components/molecules/UnderlineTabBar";

// REGRESSION CHECK: the parent Progress tabs rely on this badge to advertise unread teacher
// feedback. A count of 0 must stay invisible so the tab bar does not cry wolf.

function renderTabs(items: UnderlineTabItem[]) {
  render(
    <UnderlineTabBar
      idPrefix="t"
      ariaLabel="Tabs"
      items={items}
      value="a"
      onChange={vi.fn()}
    />,
  );
}

describe("UnderlineTabBar — count badge", () => {
  it("renders the count with its accessible description", () => {
    renderTabs([
      { id: "a", label: "Tasks" },
      { id: "b", label: "Feedback", badgeCount: 3, badgeLabel: "3 new comments" },
    ]);

    expect(screen.getByLabelText("3 new comments")).toHaveTextContent("3");
  });

  it("hides the badge when there is nothing pending", () => {
    renderTabs([
      { id: "a", label: "Tasks" },
      { id: "b", label: "Feedback", badgeCount: 0, badgeLabel: "0 new comments" },
    ]);

    expect(screen.queryByLabelText("0 new comments")).not.toBeInTheDocument();
  });

  it("leaves tabs without a badge untouched", () => {
    renderTabs([
      { id: "a", label: "Tasks" },
      { id: "b", label: "Feedback" },
    ]);

    expect(screen.getByRole("tab", { name: "Feedback" })).toHaveTextContent("Feedback");
  });
});
