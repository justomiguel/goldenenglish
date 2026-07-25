export type SectionFeatureFlagDisableCode = "has_evaluations" | "has_learning_route";

export type CanDisableFeatureFlagResult =
  | { ok: true }
  | { ok: false; code: SectionFeatureFlagDisableCode };

export function canDisableRequiresEvaluations(input: {
  assessmentCount: number;
}): CanDisableFeatureFlagResult {
  if (input.assessmentCount > 0) {
    return { ok: false, code: "has_evaluations" };
  }
  return { ok: true };
}

export function canDisableUsesLearningRoute(input: {
  learningRouteMode: "route" | "free_flow" | null;
}): CanDisableFeatureFlagResult {
  if (input.learningRouteMode === "route") {
    return { ok: false, code: "has_learning_route" };
  }
  return { ok: true };
}
