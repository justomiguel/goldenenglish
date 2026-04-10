/** @vitest-environment node */

import { describe, it, expect, vi } from "vitest";
import {
  computeAppSurface,
  isIosStandalone,
  subscribeAppSurface,
} from "@/hooks/useAppSurfaceCore";

describe("useAppSurfaceCore (node)", () => {
  it("treats surface as web-desktop without browser globals", () => {
    expect(computeAppSurface()).toBe("web-desktop");
  });

  it("treats missing navigator as non-standalone iOS", () => {
    vi.stubGlobal("navigator", undefined);
    expect(isIosStandalone()).toBe(false);
    vi.unstubAllGlobals();
  });

  it("returns noop unsubscribe when window is unavailable", () => {
    const unsub = subscribeAppSurface(() => {});
    expect(unsub()).toBeUndefined();
  });
});
