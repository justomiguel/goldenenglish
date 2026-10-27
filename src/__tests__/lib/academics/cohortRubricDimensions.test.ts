import { describe, expect, it } from "vitest";
import {
  defaultRubricDimensionsFromI18n,
  normalizeRubricValuesForDimensions,
  parseCohortRubricDimensionsJson,
  validateRubricAgainstDimensions,
} from "@/lib/academics/cohortRubricDimensions";
import { suggestedScoreForGrading } from "@/lib/academics/rubricSuggestedScoreFromDimensions";

// REGRESSION CHECK: Default cohort rubric dimensions must use scaleMin 1 and scaleMax 10,
// and missing values must normalize to the rounded integer midpoint (6 on a 1–10 scale).

describe("cohortRubricDimensions", () => {
  it("parses valid cohort JSON array and defaults scaleMax to 10 when omitted", () => {
    const raw = [
      { key: "fluency", label: "Fluidez", scaleMin: 1, scaleMax: 5 },
      { key: "grammar", label: "Gramática" },
    ];
    const d = parseCohortRubricDimensionsJson(raw);
    expect(d).toHaveLength(2);
    expect(d[0]).toMatchObject({ key: "fluency", label: "Fluidez", scaleMin: 1, scaleMax: 5 });
    expect(d[1]).toMatchObject({ key: "grammar", label: "Gramática", scaleMin: 1, scaleMax: 10 });
  });

  it("returns empty for invalid entries", () => {
    expect(parseCohortRubricDimensionsJson(null)).toEqual([]);
    expect(parseCohortRubricDimensionsJson([{ key: "", label: "x" }])).toEqual([]);
  });

  it("builds default 1–10 dimensions and normalizes missing values to integer midpoint 6", () => {
    const dims = defaultRubricDimensionsFromI18n({
      speaking: "S",
      grammar: "G",
      vocabulary: "V",
      listening: "L",
      fluency: "F",
    });
    expect(dims).toEqual([
      { key: "speaking", label: "S", scaleMin: 1, scaleMax: 10 },
      { key: "grammar", label: "G", scaleMin: 1, scaleMax: 10 },
      { key: "vocabulary", label: "V", scaleMin: 1, scaleMax: 10 },
      { key: "listening", label: "L", scaleMin: 1, scaleMax: 10 },
      { key: "fluency", label: "F", scaleMin: 1, scaleMax: 10 },
    ]);
    const norm = normalizeRubricValuesForDimensions({ speaking: 8 }, dims);
    expect(norm).toEqual({
      speaking: 8,
      grammar: 6,
      vocabulary: 6,
      listening: 6,
      fluency: 6,
    });
  });

  it("validates rubric object against 1–10 dimensions and computes suggested score", () => {
    const dims = defaultRubricDimensionsFromI18n({
      speaking: "S",
      grammar: "G",
      vocabulary: "V",
      listening: "L",
      fluency: "F",
    });
    const ok = { speaking: 2, grammar: 6, vocabulary: 8, listening: 10, fluency: 1 };
    expect(validateRubricAgainstDimensions(ok, dims)).toBe(true);
    expect(validateRubricAgainstDimensions({ ...ok, extra: 2 } as Record<string, number>, dims)).toBe(false);
    expect(validateRubricAgainstDimensions({ ...ok, grammar: 99 }, dims)).toBe(false);
    expect(
      suggestedScoreForGrading(
        { speaking: 10, grammar: 10, vocabulary: 10, listening: 10, fluency: 10 },
        dims,
        10,
      ),
    ).toBe(10);
  });
});
