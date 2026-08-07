import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useDashboardMobileDrawer } from "@/hooks/useDashboardMobileDrawer";

describe("useDashboardMobileDrawer", () => {
  const mqListeners: Array<(e: Event) => void> = [];
  let matches = false;

  beforeEach(() => {
    mqListeners.length = 0;
    matches = false;
    vi.spyOn(window, "matchMedia").mockImplementation(() => {
      const list = {
        get matches() {
          return matches;
        },
        media: "(min-width: 768px)",
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: (_: string, cb: EventListener) => {
          mqListeners.push(cb as (e: Event) => void);
        },
        removeEventListener: (_: string, cb: EventListener) => {
          const i = mqListeners.indexOf(cb as (e: Event) => void);
          if (i !== -1) mqListeners.splice(i, 1);
        },
        dispatchEvent: vi.fn(),
      };
      return list as unknown as MediaQueryList;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.style.overflow = "";
  });

  it("locks body while open and unlocks on close", () => {
    const { result } = renderHook(() => useDashboardMobileDrawer());

    act(() => {
      result.current.openDrawer();
    });
    expect(result.current.open).toBe(true);
    expect(document.body.style.overflow).toBe("hidden");

    act(() => {
      result.current.close();
    });
    expect(result.current.open).toBe(false);
    expect(document.body.style.overflow).toBe("");
  });

  it("closes on Escape while open", () => {
    const { result } = renderHook(() => useDashboardMobileDrawer());

    act(() => {
      result.current.openDrawer();
    });

    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });

    expect(result.current.open).toBe(false);
    expect(document.body.style.overflow).toBe("");
  });

  it("closes when viewport crosses md", () => {
    const { result } = renderHook(() => useDashboardMobileDrawer());

    act(() => {
      result.current.openDrawer();
    });
    expect(result.current.open).toBe(true);

    matches = true;
    act(() => {
      for (const cb of mqListeners) {
        cb(new Event("change"));
      }
    });

    expect(result.current.open).toBe(false);
    expect(document.body.style.overflow).toBe("");
  });
});
