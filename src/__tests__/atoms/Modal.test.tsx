import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Modal } from "@/components/atoms/Modal";

describe("Modal", () => {
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
});
