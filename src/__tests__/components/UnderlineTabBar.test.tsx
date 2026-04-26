// REGRESSION CHECK: UnderlineTabBar is shared; gridTwoRow is used for section
// admin tabs. Tab order, keyboard, and ARIA must stay valid for one tablist.
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UnderlineTabBar } from "@/components/molecules/UnderlineTabBar";

const items = [
  { id: "a", label: "First tab label" },
  { id: "b", label: "Second" },
  { id: "c", label: "Third" },
];

function ControlledBar() {
  const [value, setValue] = useState("a");
  return (
    <UnderlineTabBar
      idPrefix="testid"
      ariaLabel="Test tabs"
      items={items}
      value={value}
      onChange={setValue}
    />
  );
}

describe("UnderlineTabBar", () => {
  it("updates the selected tab when a tab is clicked (controlled)", async () => {
    const user = userEvent.setup();
    render(<ControlledBar />);

    expect(screen.getByRole("tab", { name: /first tab label/i })).toHaveAttribute("tabIndex", "0");
    await user.click(screen.getByRole("tab", { name: /second/i }));
    expect(screen.getByRole("tab", { name: /second/i })).toHaveAttribute("tabIndex", "0");
  });

  it("applies the grid two-row list layout when layout is gridTwoRow", () => {
    render(
      <UnderlineTabBar
        idPrefix="gridtest"
        ariaLabel="Grid tabs"
        items={items}
        value="a"
        onChange={() => {}}
        layout="gridTwoRow"
      />,
    );
    const list = screen.getByRole("tablist", { name: /grid tabs/i });
    expect(list).toHaveClass("sm:grid", "sm:grid-cols-4");
  });
});
