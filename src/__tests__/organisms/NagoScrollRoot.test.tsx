import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { NagoScrollRoot } from "@/components/organisms/NagoScrollRoot";

describe("NagoScrollRoot", () => {
  it("updates landing progress and drift layers on scroll", () => {
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    });
    vi.stubGlobal(
      "matchMedia",
      (query: string) =>
        ({
          matches: false,
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        }) as unknown as MediaQueryList,
    );

    const { container } = render(
      <div className="nago-landing">
        <NagoScrollRoot>
          <div className="nago-scroll-drift" data-nago-drift="21" />
        </NagoScrollRoot>
      </div>,
    );

    const landing = container.firstElementChild as HTMLElement;
    const layer = container.querySelector("[data-nago-drift]") as HTMLElement;
    vi.spyOn(layer, "getBoundingClientRect").mockReturnValue({
      top: 100,
      height: 0,
      bottom: 100,
      left: 0,
      right: 0,
      width: 0,
      x: 0,
      y: 100,
      toJSON: () => ({}),
    });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 800 });
    Object.defineProperty(window, "scrollY", { configurable: true, value: 200 });
    Object.defineProperty(document.documentElement, "scrollHeight", {
      configurable: true,
      value: 1600,
    });

    window.dispatchEvent(new Event("scroll"));

    expect(container.querySelector(".nago-scroll-progress")).toBeTruthy();
    expect(landing.style.getPropertyValue("--nago-page-progress")).toBe("0.25");
    expect(Number(layer.style.getPropertyValue("--nago-drift"))).toBeCloseTo(15);
  });
});
