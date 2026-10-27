import { describe, expect, it } from "vitest";
import { escapeHtml } from "@/lib/academics/escapeHtml";
import {
  ASSESSMENT_RUBRIC_KEYS,
  defaultAssessmentRubric,
  normalizeRubricFromDb,
} from "@/lib/academics/assessmentRubricDefaults";
import { suggestedScoreFromRubric } from "@/lib/academics/rubricSuggestedScore";

// REGRESSION CHECK: Default rubric values and fallback normalization must support the 1–10 scale.

describe("escapeHtml", () => {
  it("escapes all dangerous characters", () => {
    expect(escapeHtml('<a href="x">&"</a>')).toBe(
      "&lt;a href=&quot;x&quot;&gt;&amp;&quot;&lt;/a&gt;",
    );
  });

  it("returns plain text unchanged", () => {
    expect(escapeHtml("hello world")).toBe("hello world");
  });

  it("handles empty input", () => {
    expect(escapeHtml("")).toBe("");
  });
});

describe("defaultAssessmentRubric", () => {
  it("returns 6 for every rubric key on the 1–10 scale", () => {
    const r = defaultAssessmentRubric();
    for (const k of ASSESSMENT_RUBRIC_KEYS) {
      expect(r[k]).toBe(6);
    }
  });
});

describe("normalizeRubricFromDb", () => {
  it("returns defaults for null/undefined input", () => {
    expect(normalizeRubricFromDb(null)).toEqual(defaultAssessmentRubric());
    expect(normalizeRubricFromDb(undefined)).toEqual(defaultAssessmentRubric());
  });

  it("returns defaults for non-object input", () => {
    expect(normalizeRubricFromDb("not an object")).toEqual(defaultAssessmentRubric());
    expect(normalizeRubricFromDb([1, 2, 3])).toEqual(defaultAssessmentRubric());
  });

  it("merges valid numeric values within 1–10 range", () => {
    const result = normalizeRubricFromDb({
      speaking: 10,
      grammar: 1,
      vocabulary: 8,
      listening: 5,
      fluency: 7,
    });
    expect(result).toEqual({
      speaking: 10,
      grammar: 1,
      vocabulary: 8,
      listening: 5,
      fluency: 7,
    });
  });

  it("ignores out-of-range and non-numeric values", () => {
    const result = normalizeRubricFromDb({
      speaking: 99,
      grammar: 0,
      vocabulary: "bad",
      listening: NaN,
    });
    expect(result).toEqual(defaultAssessmentRubric());
  });

  it("computes suggested score from 1–10 rubric fallback", () => {
    expect(suggestedScoreFromRubric({ speaking: 8, grammar: 10 }, 10)).toBe(9);
    expect(suggestedScoreFromRubric({}, 10)).toBeNull();
    expect(suggestedScoreFromRubric({ speaking: 8 }, 0)).toBeNull();
    expect(suggestedScoreFromRubric({ speaking: 8 }, Number.NaN)).toBeNull();
  });
});
