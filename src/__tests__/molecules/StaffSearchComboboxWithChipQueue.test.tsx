/** @vitest-environment jsdom */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StaffSearchComboboxWithChipQueue } from "@/components/molecules/StaffSearchComboboxWithChipQueue";

describe("StaffSearchComboboxWithChipQueue", () => {
  it("renders chip queue when there are selected items and forwards remove", async () => {
    const user = userEvent.setup();
    const search = vi.fn().mockResolvedValue([]);
    const onPick = vi.fn();
    const onRemoveSelected = vi.fn();
    render(
      <StaffSearchComboboxWithChipQueue
        id="staff-search-test"
        labelText="Search"
        placeholder="Type"
        minCharsHint="Min"
        search={search}
        onPick={onPick}
        resetKey={0}
        persistentExcludeIds={["x"]}
        selectedItems={[{ id: "a", label: "Ada" }]}
        onRemoveSelected={onRemoveSelected}
        queueLegend="On list"
        queueReminder="Then confirm"
        removeChipAriaLabel="Remove pick"
      />,
    );
    expect(screen.getByText("On list")).toBeInTheDocument();
    expect(screen.getByText("Ada")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Remove pick" }));
    expect(onRemoveSelected).toHaveBeenCalledWith("a");
  });
});
