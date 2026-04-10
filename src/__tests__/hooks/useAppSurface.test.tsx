import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { useAppSurface } from "@/hooks/useAppSurface";

function SurfaceProbe() {
  const s = useAppSurface();
  return <span data-testid="surface">{s}</span>;
}

function mockMatchMedia(mobile: boolean, standalone: boolean) {
  return vi.fn((query: string) => ({
    matches: query.includes("max-width") ? mobile : standalone,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

describe("useAppSurface", () => {
  const originalNavigator = globalThis.navigator;

  beforeEach(() => {
    vi.stubGlobal(
      "matchMedia",
      mockMatchMedia(false, false),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    Object.defineProperty(globalThis, "navigator", {
      value: originalNavigator,
      configurable: true,
    });
  });

  it("returns web-desktop when wide and not standalone", () => {
    render(<SurfaceProbe />);
    expect(screen.getByTestId("surface")).toHaveTextContent("web-desktop");
  });

  it("runs matchMedia/orientation handlers when media queries notify", () => {
    const listeners: Array<{ type: string; fn: () => void }> = [];
    vi.stubGlobal("matchMedia", (q: string) => ({
      matches: !q.includes("max-width"),
      media: q,
      addEventListener: (type: string, fn: EventListener) => {
        listeners.push({ type, fn: fn as () => void });
      },
      removeEventListener: vi.fn(),
    }));
    const winAdd = vi.spyOn(window, "addEventListener");
    render(<SurfaceProbe />);
    for (const { fn } of listeners) fn();
    const orientHandler = winAdd.mock.calls.find(
      (c) => c[0] === "orientationchange",
    )?.[1] as (() => void) | undefined;
    orientHandler?.();
    winAdd.mockRestore();
  });

  it("returns web-mobile when narrow and browser tab", () => {
    vi.stubGlobal("matchMedia", mockMatchMedia(true, false));
    render(<SurfaceProbe />);
    expect(screen.getByTestId("surface")).toHaveTextContent("web-mobile");
  });

  it("returns pwa-mobile when narrow and standalone", () => {
    vi.stubGlobal("matchMedia", mockMatchMedia(true, true));
    render(<SurfaceProbe />);
    expect(screen.getByTestId("surface")).toHaveTextContent("pwa-mobile");
  });

  it("treats iOS navigator.standalone as standalone", () => {
    vi.stubGlobal("matchMedia", mockMatchMedia(true, false));
    Object.defineProperty(globalThis, "navigator", {
      value: { ...originalNavigator, standalone: true },
      configurable: true,
    });
      render(<SurfaceProbe />);
    expect(screen.getByTestId("surface")).toHaveTextContent("pwa-mobile");
  });

  it("uses web-desktop snapshot during SSR string render", () => {
    const html = renderToString(<SurfaceProbe />);
    expect(html).toContain("web-desktop");
  });

  it("unsubscribes media listeners on unmount", () => {
    const mobile = {
      matches: false,
      media: "(max-width: 767px)",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    const standalone = {
      matches: false,
      media: "(display-mode: standalone)",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    vi.stubGlobal("matchMedia", (q: string) =>
      q.includes("max-width") ? mobile : standalone,
    );
    const orient = vi.spyOn(window, "removeEventListener");
    const { unmount } = render(<SurfaceProbe />);
    unmount();
    expect(mobile.removeEventListener).toHaveBeenCalled();
    expect(standalone.removeEventListener).toHaveBeenCalled();
    expect(orient).toHaveBeenCalledWith(
      "orientationchange",
      expect.any(Function),
    );
    orient.mockRestore();
  });
});
