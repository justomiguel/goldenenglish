export const ASSESSMENT_RUBRIC_KEYS = ["speaking", "grammar", "vocabulary", "listening", "fluency"] as const;

export type AssessmentRubricKey = (typeof ASSESSMENT_RUBRIC_KEYS)[number];

export function defaultAssessmentRubric(): Record<AssessmentRubricKey, number> {
  return {
    speaking: 6,
    grammar: 6,
    vocabulary: 6,
    listening: 6,
    fluency: 6,
  };
}

export function normalizeRubricFromDb(raw: unknown): Record<AssessmentRubricKey, number> {
  const base = defaultAssessmentRubric();
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const o = raw as Record<string, unknown>;
    for (const k of ASSESSMENT_RUBRIC_KEYS) {
      const n = Number(o[k]);
      if (Number.isFinite(n) && n >= 1 && n <= 10) base[k] = n;
    }
  }
  return base;
}
