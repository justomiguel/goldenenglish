/**
 * When lowering cohort_assessments.max_score, existing enrollment_assessment_grades.score
 * must not exceed the new cap (strict block per product rule).
 */
export function isProposedCohortAssessmentMaxScoreAllowed(
  proposedMax: number,
  maxExistingGradeScore: number,
): boolean {
  if (!Number.isFinite(proposedMax) || !Number.isFinite(maxExistingGradeScore)) return false;
  return proposedMax + 1e-6 >= maxExistingGradeScore;
}
