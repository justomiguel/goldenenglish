import { describe, it, expect } from "vitest";
import dictEn from "@/dictionaries/en.json";
import {
  buildParentFeedbackMetaParts,
  formatParentFeedbackDate,
  formatParentFeedbackNewSummary,
  formatParentFeedbackScore,
  parentFeedbackSourceLabel,
} from "@/lib/parent/formatParentFeedbackLabels";
import type { ParentFeedbackItem } from "@/types/parentFeedback";

// REGRESSION CHECK: both the desktop timeline and the PWA list read their strings from here.
// Changing a signature silently desyncs the two surfaces, so keep them driven by one contract.

const copy = dictEn.dashboard.parent.feedback;

function item(overrides: Partial<ParentFeedbackItem> = {}): ParentFeedbackItem {
  return {
    id: "assessment:g1",
    source: "assessment",
    studentId: "stu-1",
    childLabel: "Adams, Zara",
    title: "Unit 3 exam",
    contextLabel: "B1 — Group A",
    teacherName: "Ruiz, Marta",
    occurredOn: "2026-08-01",
    score: 82,
    maxScore: 100,
    feedback: "Great progress.",
    isNew: true,
    ...overrides,
  };
}

describe("formatParentFeedbackDate", () => {
  it("formats a date-only value with Intl in the active locale", () => {
    expect(formatParentFeedbackDate("2026-08-01", "en")).toBe("Aug 1, 2026");
  });

  it("does not shift the day across timezones", () => {
    expect(formatParentFeedbackDate("2026-01-01", "en")).toContain("2026");
    expect(formatParentFeedbackDate("2026-01-01", "en")).toContain("1");
  });

  it("returns an empty string for unusable input", () => {
    expect(formatParentFeedbackDate("", "en")).toBe("");
    expect(formatParentFeedbackDate("nope", "en")).toBe("");
  });
});

describe("formatParentFeedbackScore", () => {
  it("builds a score line when both score and max are present", () => {
    expect(formatParentFeedbackScore(item(), copy)).toEqual({
      label: "82 / 100",
      ariaLabel: "Score 82 out of 100",
    });
  });

  it("returns null when the entry carries no score", () => {
    expect(formatParentFeedbackScore(item({ score: null }), copy)).toBeNull();
    expect(formatParentFeedbackScore(item({ maxScore: null }), copy)).toBeNull();
  });
});

describe("parentFeedbackSourceLabel", () => {
  it("maps each source to its own label", () => {
    expect(parentFeedbackSourceLabel("assessment", copy)).toBe(copy.sourceAssessment);
    expect(parentFeedbackSourceLabel("learning", copy)).toBe(copy.sourceLearning);
  });
});

describe("buildParentFeedbackMetaParts", () => {
  it("lists context, teacher, and date without empty fragments", () => {
    expect(buildParentFeedbackMetaParts(item(), "en", copy)).toEqual([
      "B1 — Group A",
      "By Ruiz, Marta",
      "Aug 1, 2026",
    ]);
  });

  it("skips missing context and teacher", () => {
    expect(
      buildParentFeedbackMetaParts(item({ contextLabel: "", teacherName: null }), "en", copy),
    ).toEqual(["Aug 1, 2026"]);
  });
});

describe("formatParentFeedbackNewSummary", () => {
  it("returns null when nothing is new", () => {
    expect(formatParentFeedbackNewSummary(0, 14, copy)).toBeNull();
  });

  it("uses the singular branch for exactly one entry", () => {
    expect(formatParentFeedbackNewSummary(1, 14, copy)).toBe("1 new comment in the last 14 days");
  });

  it("uses the plural branch beyond one entry", () => {
    expect(formatParentFeedbackNewSummary(3, 14, copy)).toBe("3 new comments in the last 14 days");
  });
});
