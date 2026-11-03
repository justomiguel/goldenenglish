import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { GenericLandingMotion } from "@/components/organisms/generic-landing/GenericLandingMotion";

function mockMotion(reduce: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: reduce && query.includes("reduce"),
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
    onchange: null,
  })) as unknown as typeof window.matchMedia;
}

describe("GenericLandingMotion", () => {
  it("stays shown when motion is reduced", async () => {
    mockMotion(true);
    render(
      <GenericLandingMotion>
        <p>Hola</p>
      </GenericLandingMotion>,
    );
    await waitFor(() => {
      expect(screen.getByText("Hola").parentElement).toHaveAttribute("data-generic-motion", "shown");
    });
    expect(screen.getByText("Hola").parentElement?.className ?? "").not.toContain("translate");
  });

  it("waits when the block is offscreen", async () => {
    mockMotion(false);
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      top: 4000,
      left: 0,
      right: 0,
      bottom: 0,
      width: 0,
      height: 0,
      x: 0,
      y: 4000,
      toJSON: () => ({}),
    });
    class QuietObserver {
      observe() {}
      disconnect() {}
      unobserve() {}
    }
    vi.stubGlobal("IntersectionObserver", QuietObserver);

    render(
      <GenericLandingMotion>
        <p>Lejos</p>
      </GenericLandingMotion>,
    );
    await waitFor(() => {
      expect(screen.getByText("Lejos").parentElement).toHaveAttribute("data-generic-motion", "wait");
    });
  });
});
