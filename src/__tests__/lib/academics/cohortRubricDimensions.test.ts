import { describe, expect, it } from "vitest";
import {
  defaultRubricDimensionsFromI18n,
  parseCohortRubricDimensionsJson,
  validateRubricAgainstDimensions,
} from "@/lib/academics/cohortRubricDimensions";

describe("cohortRubricDimensions", () => {
  it("parses valid cohort JSON array", () => {
    const raw = [
      { key: "fluency", label: "Fluidez", scaleMin: 1, scaleMax: 5 },
      { key: "grammar", label: "Gramática" },
    ];
    const d = parseCohortRubricDimensionsJson(raw);
    expect(d).toHaveLength(2);
    expect(d[0]).toMatchObject({ key: "fluency", label: "Fluidez", scaleMin: 1, scaleMax: 5 });
    expect(d[1]).toMatchObject({ key: "grammar", label: "Gramática", scaleMin: 1, scaleMax: 5 });
  });

  it("returns empty for invalid entries", () => {
    expect(parseCohortRubricDimensionsJson(null)).toEqual([]);
    expect(parseCohortRubricDimensionsJson([{ key: "", label: "x" }])).toEqual([]);
  });

  it("validates rubric object against dimensions", () => {
    const dims = defaultRubricDimensionsFromI18n({
      speaking: "S",
      grammar: "G",
      vocabulary: "V",
      listening: "L",
      fluency: "F",
    });
    const ok = { speaking: 2, grammar: 3, vocabulary: 4, listening: 5, fluency: 1 };
    expect(validateRubricAgainstDimensions(ok, dims)).toBe(true);
    expect(validateRubricAgainstDimensions({ ...ok, extra: 2 } as Record<string, number>, dims)).toBe(false);
    expect(validateRubricAgainstDimensions({ ...ok, grammar: 99 }, dims)).toBe(false);
  });
});
