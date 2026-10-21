import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminHubCardResizeHandle } from "@/components/dashboard/AdminHubCardResizeHandle";

function rect(left: number, width: number): DOMRect {
  return {
    x: left,
    y: 0,
    top: 0,
    left,
    right: left + width,
    bottom: 200,
    width,
    height: 200,
    toJSON() {
      return {};
    },
  };
}

describe("AdminHubCardResizeHandle", () => {
  it("snaps to the next stipulated size while the edge moves", () => {
    const onSize = vi.fn();
    render(
      <div data-admin-home-grid="">
        <div data-admin-home-slot="">
          <AdminHubCardResizeHandle
            id="payments"
            currentSize="s"
            label="Resize payments"
            valueText="Small"
            onSize={onSize}
          />
        </div>
      </div>,
    );
    const grid = document.querySelector("[data-admin-home-grid]") as HTMLElement;
    const slot = document.querySelector("[data-admin-home-slot]") as HTMLElement;
    vi.spyOn(grid, "getBoundingClientRect").mockReturnValue(rect(0, 1200));
    vi.spyOn(slot, "getBoundingClientRect").mockReturnValue(rect(0, 400));
    const handle = screen.getByRole("slider", { name: "Resize payments" });
    fireEvent.pointerDown(handle, { button: 0, pointerId: 1, clientX: 400 });
    window.dispatchEvent(new MouseEvent("pointermove", { clientX: 700, bubbles: true }));
    expect(onSize).toHaveBeenCalledWith("l");
    fireEvent.pointerUp(handle, { pointerId: 1 });
  });

  it("grows and shrinks with the arrow keys", () => {
    const onSize = vi.fn();
    render(
      <AdminHubCardResizeHandle
        id="payments"
        currentSize="m"
        label="Resize payments"
        valueText="Medium"
        onSize={onSize}
      />,
    );
    const handle = screen.getByRole("slider", { name: "Resize payments" });
    fireEvent.keyDown(handle, { key: "ArrowRight" });
    expect(onSize).toHaveBeenCalledWith("l");
    fireEvent.keyDown(handle, { key: "ArrowLeft" });
    expect(onSize).toHaveBeenCalledWith("s");
  });
});
