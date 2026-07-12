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
        closeLabel="Close"
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
        closeLabel="Close"
      >
        <p>Inner</p>
      </Modal>,
    );
    expect(screen.getByText("Dialog title")).toBeInTheDocument();
    expect(screen.getByText("Inner")).toBeInTheDocument();
  });

  it("notifies onOpenChange on Escape cancel then close", () => {
    const onOpenChange = vi.fn();
    render(
      <Modal
        open
        titleId="modal-title"
        onOpenChange={onOpenChange}
        title="T"
        closeLabel="Close"
      >
        x
      </Modal>,
    );
    const dlg = document.querySelector("dialog");
    expect(dlg).toBeTruthy();
    dlg!.dispatchEvent(new Event("cancel", { cancelable: true }));
    dlg!.dispatchEvent(new Event("close"));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("does not notify onOpenChange for spurious close while React open stays true", () => {
    const proto = HTMLDialogElement.prototype as unknown as Record<string, unknown>;
    const prevShowModal = proto.showModal;
    let showModalCalls = 0;
    proto.showModal = function (this: HTMLDialogElement) {
      showModalCalls += 1;
      this.setAttribute("open", "");
    };
    const onOpenChange = vi.fn();
    try {
      render(
        <Modal
          open
          titleId="modal-title"
          onOpenChange={onOpenChange}
          title="T"
          closeLabel="Close"
        >
          x
        </Modal>,
      );
      const dlg = document.querySelector("dialog");
      expect(dlg).toBeTruthy();
      dlg!.removeAttribute("open");
      dlg!.dispatchEvent(new Event("close"));
      expect(onOpenChange).not.toHaveBeenCalled();
      expect(showModalCalls).toBeGreaterThan(0);
      expect(dlg!.hasAttribute("open")).toBe(true);
    } finally {
      if (prevShowModal === undefined) delete proto.showModal;
      else proto.showModal = prevShowModal;
    }
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
        closeLabel="Close"
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
        closeLabel="Close"
      >
        x
      </Modal>,
    );
    expect(closeSpy).toHaveBeenCalled();
    closeSpy.mockRestore();
  });

  it("uses dictionary modal close label when closeLabel is omitted (locale from path)", () => {
    render(
      <Modal
        open
        titleId="modal-title"
        onOpenChange={vi.fn()}
        title="T"
      >
        x
      </Modal>,
    );
    expect(screen.getByRole("button", { name: "Cerrar" })).toBeInTheDocument();
  });

  it("uses show() not showModal when stackBelowTour is true", () => {
    const proto = HTMLDialogElement.prototype as unknown as Record<string, unknown>;
    const prevShow = proto.show;
    const prevShowModal = proto.showModal;
    let showCalls = 0;
    let showModalCalls = 0;
    proto.show = function (this: HTMLDialogElement) {
      showCalls += 1;
      this.setAttribute("open", "");
    };
    proto.showModal = function (this: HTMLDialogElement) {
      showModalCalls += 1;
      this.setAttribute("open", "");
    };
    try {
      render(
        <Modal
          open
          titleId="modal-title"
          onOpenChange={vi.fn()}
          title="T"
          closeLabel="Close"
          stackBelowTour
        >
          x
        </Modal>,
      );
      expect(showCalls).toBeGreaterThan(0);
      expect(showModalCalls).toBe(0);
      expect(document.querySelector("dialog")).toHaveClass("ge-modal-stacked");
      expect(document.querySelector("[data-ge-modal-stacked-scrim]")).toBeTruthy();
    } finally {
      if (prevShow === undefined) delete proto.show;
      else proto.show = prevShow;
      if (prevShowModal === undefined) delete proto.showModal;
      else proto.showModal = prevShowModal;
    }
  });

  it("keeps dialog open via show() when stackBelowTour ends (no promote close)", async () => {
    const proto = HTMLDialogElement.prototype as unknown as Record<string, unknown>;
    const prevShow = proto.show;
    const prevShowModal = proto.showModal;
    const prevClose = proto.close;
    let showModalCalls = 0;
    let closeCalls = 0;
    proto.show = function (this: HTMLDialogElement) {
      this.setAttribute("open", "");
    };
    proto.showModal = function (this: HTMLDialogElement) {
      showModalCalls += 1;
      this.setAttribute("open", "");
    };
    proto.close = function (this: HTMLDialogElement) {
      closeCalls += 1;
      this.removeAttribute("open");
      this.dispatchEvent(new Event("close"));
    };

    const onOpenChange = vi.fn();
    try {
      const { rerender } = render(
        <Modal
          open
          titleId="modal-title"
          onOpenChange={onOpenChange}
          title="T"
          closeLabel="Close"
          stackBelowTour
        >
          x
        </Modal>,
      );
      expect(document.querySelector("dialog")).toHaveClass("ge-modal-stacked");
      expect(document.querySelector("dialog")?.hasAttribute("open")).toBe(true);

      rerender(
        <Modal
          open
          titleId="modal-title"
          onOpenChange={onOpenChange}
          title="T"
          closeLabel="Close"
          stackBelowTour={false}
        >
          x
        </Modal>,
      );

      await Promise.resolve();
      expect(onOpenChange).not.toHaveBeenCalledWith(false);
      expect(closeCalls).toBe(0);
      expect(showModalCalls).toBe(0);
      expect(document.querySelector("dialog")?.hasAttribute("open")).toBe(true);
    } finally {
      if (prevShow === undefined) delete proto.show;
      else proto.show = prevShow;
      if (prevShowModal === undefined) delete proto.showModal;
      else proto.showModal = prevShowModal;
      if (prevClose === undefined) delete proto.close;
      else proto.close = prevClose;
    }
  });
});
