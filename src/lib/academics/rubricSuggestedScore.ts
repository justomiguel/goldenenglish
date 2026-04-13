/** Average of rubric values in 1–5 range; ignores non-finite or out-of-range entries. */
export function averageRubric1to5(rubric: Record<string, number>): number | null {
  const vals = Object.values(rubric).filter((n) => typeof n === "number" && n >= 1 && n <= 5);
  if (vals.length === 0) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

/** Maps average rubric (1–5) linearly to [0, maxScore], rounded to 2 decimals. */
export function suggestedScoreFromRubric(rubric: Record<string, number>, maxScore: number): number | null {
  const avg = averageRubric1to5(rubric);
  if (avg == null || !Number.isFinite(maxScore) || maxScore <= 0) return null;
  const raw = (avg / 5) * maxScore;
  return Math.round(raw * 100) / 100;
}
