import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmActionModal } from "@/components/molecules/ConfirmActionModal";

describe("ConfirmActionModal", () => {
  it("invokes onConfirm when confirm is pressed", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <ConfirmActionModal
        open={true}
        onOpenChange={() => {}}
        title="Test title"
        description="Test body"
        cancelLabel="Cancel"
        confirmLabel="OK"
        onConfirm={onConfirm}
      />,
    );
    await user.click(screen.getByRole("button", { name: "OK" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
