// REGRESSION CHECK: `/dashboard/parent/feedback` and parent tours deep-link with `?tab=`. Those
// panels must mount even when empty so empty-state copy and `data-tour` anchors stay reachable.

import { describe, expect, it } from "vitest";
import {
  isProgressSectionId,
  resolveActiveProgressSection,
} from "@/lib/parent/resolveActiveProgressSection";
import type { ProgressSection } from "@/lib/parent/buildProgressSections";

const SECTIONS: ProgressSection[] = [
  { id: "assessments", count: 1, itemKeys: ["a1"] },
  { id: "feedback", count: 2, itemKeys: ["f1", "f2"] },
];

describe("resolveActiveProgressSection", () => {
  it("honours a requested section that has content", () => {
    expect(resolveActiveProgressSection("feedback", SECTIONS)).toBe("feedback");
  });

  it("honours a known ?tab= even when that section has nothing to show", () => {
    expect(resolveActiveProgressSection("badges", SECTIONS)).toBe("badges");
    expect(resolveActiveProgressSection("tasks", SECTIONS)).toBe("tasks");
  });

  it("falls back when no section was requested", () => {
    expect(resolveActiveProgressSection(null, SECTIONS)).toBe("assessments");
    expect(resolveActiveProgressSection(undefined, SECTIONS)).toBe("assessments");
  });

  it("falls back for unknown tab values", () => {
    expect(resolveActiveProgressSection("not-a-section", SECTIONS)).toBe("assessments");
  });

  it("still opens a known empty deep link when nothing else is available", () => {
    expect(resolveActiveProgressSection("feedback", [])).toBe("feedback");
  });

  it("returns an empty id when nothing is requested and nothing is available", () => {
    expect(resolveActiveProgressSection(null, [])).toBe("");
  });
});

describe("isProgressSectionId", () => {
  it("recognises the Progress hub tabs", () => {
    expect(isProgressSectionId("badges")).toBe(true);
    expect(isProgressSectionId("exams")).toBe(true);
    expect(isProgressSectionId("nope")).toBe(false);
    expect(isProgressSectionId(null)).toBe(false);
  });
});
