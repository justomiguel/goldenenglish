import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { dictEn } from "@/test/dictEn";
import { CollectionsActionBar } from "@/components/dashboard/admin/finance/CollectionsActionBar";

const actionBarDict = dictEn.admin.finance.collections.actionBar;
const matrixDict = dictEn.admin.finance.collections.matrix;

describe("CollectionsActionBar", () => {
  it("renders nothing when selectionCount is 0", () => {
    const { container } = render(
      <CollectionsActionBar
        selectionCount={0}
        overdueBusy={false}
        onMessage={vi.fn()}
        onRemindOverdue={vi.fn()}
        onClearSelection={vi.fn()}
        actionBarDict={actionBarDict}
        matrixDict={matrixDict}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders with message, remind, and clear buttons when selectionCount > 0", () => {
    render(
      <CollectionsActionBar
        selectionCount={5}
        overdueBusy={false}
        onMessage={vi.fn()}
        onRemindOverdue={vi.fn()}
        onClearSelection={vi.fn()}
        actionBarDict={actionBarDict}
        matrixDict={matrixDict}
      />,
    );
    expect(screen.getByText("5 selected")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: new RegExp(actionBarDict.messageSelected) }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: new RegExp(actionBarDict.remindOverdue) }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: actionBarDict.clearAll }),
    ).toBeInTheDocument();
  });

  it("calls onMessage when message button is clicked", async () => {
    const onMessage = vi.fn();
    render(
      <CollectionsActionBar
        selectionCount={3}
        overdueBusy={false}
        onMessage={onMessage}
        onRemindOverdue={vi.fn()}
        onClearSelection={vi.fn()}
        actionBarDict={actionBarDict}
        matrixDict={matrixDict}
      />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: new RegExp(actionBarDict.messageSelected) }),
    );
    expect(onMessage).toHaveBeenCalledOnce();
  });

  it("calls onClearSelection when clear button is clicked", async () => {
    const onClear = vi.fn();
    render(
      <CollectionsActionBar
        selectionCount={2}
        overdueBusy={false}
        onMessage={vi.fn()}
        onRemindOverdue={vi.fn()}
        onClearSelection={onClear}
        actionBarDict={actionBarDict}
        matrixDict={matrixDict}
      />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: actionBarDict.clearAll }),
    );
    expect(onClear).toHaveBeenCalledOnce();
  });
});
