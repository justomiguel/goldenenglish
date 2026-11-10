import { describe, expect, it } from "vitest";
import {
  activeAnchorIndex,
  buildLioraRibbonPath,
  fractionForY,
  lioraPoseFor,
  ribbonSideForText,
  ribbonX,
  type LioraRibbonAnchor,
} from "@/lib/landing/lioraRibbonPath";

const anchors: LioraRibbonAnchor[] = [
  { y: 300, side: "end", pose: "arabesque" },
  { y: 900, side: "start", pose: "pirouette" },
  { y: 1500, side: "center", pose: "reverence" },
];

describe("ribbonX", () => {
  it("puts start on the left margin, end on the right margin, and center in the middle", () => {
    expect(ribbonX("start", 1000, 40)).toBe(40);
    expect(ribbonX("end", 1000, 40)).toBe(960);
    expect(ribbonX("center", 1000, 40)).toBe(500);
  });
});

describe("buildLioraRibbonPath", () => {
  it("returns an empty path for fewer than two anchors", () => {
    expect(buildLioraRibbonPath([], 1000, 40)).toBe("");
    expect(buildLioraRibbonPath(anchors.slice(0, 1), 1000, 40)).toBe("");
  });

  it("starts at the first anchor and ends at the last anchor", () => {
    const d = buildLioraRibbonPath(anchors, 1000, 40);
    expect(d.startsWith("M960 300")).toBe(true);
    expect(d.endsWith("500 1500")).toBe(true);
  });

  it("draws one cubic segment per gap with vertical control points", () => {
    const d = buildLioraRibbonPath(anchors, 1000, 40);
    expect(d.match(/C/g)).toHaveLength(2);
    expect(d).toContain("C960 600 40 600 40 900");
  });
});

describe("ribbonSideForText", () => {
  it("puts the ribbon on the side opposite to the text", () => {
    expect(ribbonSideForText("start", "start")).toBe("end");
    expect(ribbonSideForText("end", "end")).toBe("start");
  });

  it("keeps center text centered and alternates for full-width sections", () => {
    expect(ribbonSideForText("center", "end")).toBe("center");
    expect(ribbonSideForText("full", "end")).toBe("start");
    expect(ribbonSideForText("full", "start")).toBe("end");
  });
});

describe("fractionForY", () => {
  const samples = [
    { f: 0, y: 300 },
    { f: 0.5, y: 900 },
    { f: 1, y: 1500 },
  ];

  it("clamps before the first and after the last sample", () => {
    expect(fractionForY(samples, 0)).toBe(0);
    expect(fractionForY(samples, 4000)).toBe(1);
  });

  it("interpolates between samples", () => {
    expect(fractionForY(samples, 600)).toBeCloseTo(0.25);
    expect(fractionForY(samples, 1200)).toBeCloseTo(0.75);
  });

  it("returns 0 when there are no samples", () => {
    expect(fractionForY([], 500)).toBe(0);
  });
});

describe("activeAnchorIndex", () => {
  it("picks the last anchor the tip has reached", () => {
    expect(activeAnchorIndex(anchors, 100)).toBe(0);
    expect(activeAnchorIndex(anchors, 950)).toBe(1);
    expect(activeAnchorIndex(anchors, 9000)).toBe(2);
  });
});

describe("lioraPoseFor", () => {
  it("maps each section to its pose", () => {
    expect(lioraPoseFor("hero")).toBe("arabesque");
    expect(lioraPoseFor("sedes")).toBe("grandJete");
    expect(lioraPoseFor("cta")).toBe("reverence");
  });

  it("falls back to arabesque for an unknown section", () => {
    expect(lioraPoseFor("nope")).toBe("arabesque");
  });
});
