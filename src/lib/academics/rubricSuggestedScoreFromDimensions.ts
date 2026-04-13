import type { RubricDimensionDef } from "@/types/rubricDimensions";
import { suggestedScoreFromRubric } from "@/lib/academics/rubricSuggestedScore";

/** Normalizes each rubric value to [0,1] using its dimension scale, then maps average to maxScore. */
export function suggestedScoreFromRubricDimensions(
  rubric: Record<string, number>,
  dimensions: RubricDimensionDef[],
  maxScore: number,
): number | null {
  if (!dimensions.length || !Number.isFinite(maxScore) || maxScore <= 0) return null;
  let sum = 0;
  for (const d of dimensions) {
    const v = rubric[d.key];
    if (typeof v !== "number" || !Number.isFinite(v)) return null;
    const span = d.scaleMax - d.scaleMin;
    if (span <= 0) return null;
    sum += (v - d.scaleMin) / span;
  }
  const avg = sum / dimensions.length;
  const raw = avg * maxScore;
  return Math.round(raw * 100) / 100;
}

/** Uses dimension-aware suggestion when dimensions exist; otherwise legacy 1–5 average. */
export function suggestedScoreForGrading(
  rubric: Record<string, number>,
  dimensions: RubricDimensionDef[],
  maxScore: number,
): number | null {
  if (dimensions.length) {
    return suggestedScoreFromRubricDimensions(rubric, dimensions, maxScore);
  }
  return suggestedScoreFromRubric(rubric, maxScore);
}
