// REGRESSION CHECK: Help chat panel is FAB-anchored (not a full Modal).
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminHelpChatPanel } from "@/components/dashboard/AdminHelpChatPanel";

describe("AdminHelpChatPanel", () => {
  it("renders as a non-modal dialog with close control", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <AdminHelpChatPanel
        id="help-panel"
        titleId="help-title"
        title="Help"
        descriptionId="help-desc"
        description="No composer"
        closeLabel="Close help panel"
        onClose={onClose}
      >
        <p>Preset links</p>
      </AdminHelpChatPanel>,
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "false");
    expect(screen.getByText("Preset links")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Close help panel" }));
    expect(onClose).toHaveBeenCalled();
  });
});
