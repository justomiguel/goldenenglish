import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LioraRibbonOverlay } from "@/components/organisms/LioraRibbonOverlay";

const rects: Record<string, { top: number; height: number }> = {
  layer: { top: 0, height: 3000 },
  hero: { top: 0, height: 800 },
  sobre: { top: 800, height: 700 },
  cta: { top: 2300, height: 600 },
};

function rectFor(el: Element): DOMRect {
  const key = (el as HTMLElement).dataset.lioraAnchor ?? ((el as HTMLElement).classList.contains("liora-ribbon-layer") ? "layer" : "");
  const r = rects[key] ?? { top: 0, height: 0 };
  return { top: r.top, height: r.height, width: 1440, left: 0, right: 1440, bottom: r.top + r.height, x: 0, y: r.top, toJSON: () => ({}) } as DOMRect;
}

let reduced = false;

beforeEach(() => {
  reduced = false;
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    return rectFor(this);
  });
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: reduced && query.includes("reduce"),
    media: query,
    addEventListener() {},
    removeEventListener() {},
  }));
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function renderLanding() {
  return render(
    <main>
      <section data-liora-anchor="hero" data-liora-side="start" />
      <section data-liora-anchor="sobre" data-liora-side="end" />
      <section data-liora-anchor="cta" data-liora-side="center" />
      <LioraRibbonOverlay />
    </main>,
  );
}

describe("LioraRibbonOverlay", () => {
  it("is decoration hidden from assistive technology", () => {
    const { container } = renderLanding();
    const layer = container.querySelector(".liora-ribbon-layer");
    expect(layer).toHaveAttribute("aria-hidden", "true");
  });

  it("draws one ribbon through the section anchors, opposite to the text", () => {
    const { container } = renderLanding();
    const path = container.querySelector(".liora-ribbon-path");
    expect(path).not.toBeNull();
    const d = path?.getAttribute("d") ?? "";
    expect(d.startsWith("M1368 360")).toBe(true);
    expect(d).toContain("72 856");
    expect(d.endsWith("720 2356")).toBe(true);
  });

  it("starts the dancer in arabesque and changes pose when the tip reaches a section", () => {
    const { container } = renderLanding();
    expect(container.querySelector("[data-pose]")?.getAttribute("data-pose")).toBe("arabesque");
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    });
    rects.layer = { top: -1600, height: 3000 };
    act(() => {
      window.dispatchEvent(new Event("scroll"));
    });
    rects.layer = { top: 0, height: 3000 };
    expect(container.querySelector(".liora-ribbon-pose")?.getAttribute("data-pose")).toBe("pirouette");
  });

  it("shows the full ribbon and keeps the dancer still with reduced motion", () => {
    reduced = true;
    const { container } = renderLanding();
    const layer = container.querySelector<HTMLElement>(".liora-ribbon-layer");
    expect(layer?.style.getPropertyValue("--liora-ribbon-progress")).toBe("1");
    expect(layer?.style.getPropertyValue("--liora-dancer-progress")).toBe("0");
  });
});
