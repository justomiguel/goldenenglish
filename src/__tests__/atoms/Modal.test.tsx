import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Modal } from "@/components/atoms/Modal";

describe("Modal", () => {
  it("passes aria-label to dialog when provided", () => {
    render(
      <Modal
        open
        titleId="modal-title"
        onOpenChange={vi.fn()}
        title="T"
        ariaLabel="A11y label"
      >
        x
      </Modal>,
    );
    expect(screen.getByRole("dialog")).toHaveAttribute(
      "aria-label",
      "A11y label",
    );
  });

  it("renders title and children", () => {
    render(
      <Modal
        open
        titleId="modal-title"
        onOpenChange={vi.fn()}
        title="Dialog title"
      >
        <p>Inner</p>
      </Modal>,
    );
    expect(screen.getByText("Dialog title")).toBeInTheDocument();
    expect(screen.getByText("Inner")).toBeInTheDocument();
  });

  it("notifies onOpenChange when dialog fires close", () => {
    const onOpenChange = vi.fn();
    render(
      <Modal
        open
        titleId="modal-title"
        onOpenChange={onOpenChange}
        title="T"
      >
        x
      </Modal>,
    );
    const dlg = document.querySelector("dialog");
    expect(dlg).toBeTruthy();
    dlg!.dispatchEvent(new Event("close"));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("closes dialog in effect when open becomes false", () => {
    const closeSpy = vi.spyOn(HTMLDialogElement.prototype, "close");
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <Modal
        open
        titleId="modal-title"
        onOpenChange={onOpenChange}
        title="T"
      >
        x
      </Modal>,
    );
    rerender(
      <Modal
        open={false}
        titleId="modal-title"
        onOpenChange={onOpenChange}
        title="T"
      >
        x
      </Modal>,
    );
    expect(closeSpy).toHaveBeenCalled();
    closeSpy.mockRestore();
  });
});
