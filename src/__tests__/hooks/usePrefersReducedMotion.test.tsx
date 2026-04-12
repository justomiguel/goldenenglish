/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

describe("usePrefersReducedMotion", () => {
  beforeEach(() => {
    vi.spyOn(window, "matchMedia").mockImplementation((query: string) => {
      const mql = {
        media: query,
        matches: query.includes("reduce") && query.includes("motion"),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
      return mql as unknown as MediaQueryList;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns snapshot from matchMedia and cleans up listener", () => {
    const mq = {
      media: "(prefers-reduced-motion: reduce)",
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    vi.mocked(window.matchMedia).mockReturnValue(mq as unknown as MediaQueryList);

    const { result, unmount } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(true);
    expect(mq.addEventListener).toHaveBeenCalledWith("change", expect.any(Function));

    const cb = vi.mocked(mq.addEventListener).mock.calls[0][1] as () => void;
    vi.mocked(window.matchMedia).mockReturnValue({
      ...mq,
      matches: false,
    } as unknown as MediaQueryList);
    act(() => {
      cb();
    });
    expect(result.current).toBe(false);

    unmount();
    expect(mq.removeEventListener).toHaveBeenCalledWith("change", cb);
  });
});
