import { describe, expect, it } from "vitest";
import { escapeHtml } from "@/lib/academics/escapeHtml";
import {
  ASSESSMENT_RUBRIC_KEYS,
  defaultAssessmentRubric,
  normalizeRubricFromDb,
} from "@/lib/academics/assessmentRubricDefaults";

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
  it("returns 3 for every rubric key", () => {
    const r = defaultAssessmentRubric();
    for (const k of ASSESSMENT_RUBRIC_KEYS) {
      expect(r[k]).toBe(3);
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

  it("merges valid numeric values within range", () => {
    const result = normalizeRubricFromDb({
      speaking: 5,
      grammar: 1,
      vocabulary: 4,
      listening: 2,
      fluency: 3,
    });
    expect(result).toEqual({
      speaking: 5,
      grammar: 1,
      vocabulary: 4,
      listening: 2,
      fluency: 3,
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
});
