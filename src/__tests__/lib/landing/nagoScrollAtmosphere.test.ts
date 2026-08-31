import { describe, expect, it, vi } from "vitest";
import {
  applyNagoScrollAtmosphere,
  nagoDriftOffset,
  nagoPageProgress,
} from "@/lib/landing/nagoScrollAtmosphere";

describe("nagoScrollAtmosphere", () => {
  it("clamps page progress between 0 and 1", () => {
    expect(nagoPageProgress(0, 800)).toBe(0);
    expect(nagoPageProgress(400, 800)).toBe(0.5);
    expect(nagoPageProgress(900, 800)).toBe(1);
    expect(nagoPageProgress(10, 0)).toBe(0);
  });

  it("moves drift opposite to the element offset from viewport center", () => {
    expect(nagoDriftOffset(100, 400, 21)).toBeCloseTo(15);
    expect(nagoDriftOffset(700, 400, 21)).toBeCloseTo(-15);
  });

  it("writes progress and drift CSS variables", () => {
    const landing = document.createElement("div");
    const layer = document.createElement("div");
    layer.dataset.nagoDrift = "21";
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

    applyNagoScrollAtmosphere({
      landing,
      drifts: [layer],
      scrollY: 200,
      maxScroll: 800,
      viewportHeight: 800,
    });

    expect(landing.style.getPropertyValue("--nago-page-progress")).toBe("0.25");
    expect(Number(layer.style.getPropertyValue("--nago-drift"))).toBeCloseTo(15);
  });
});
