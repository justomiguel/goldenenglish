// REGRESSION CHECK: Turning feature flags off must stay blocked while
// section assessments or a concrete learning route assignment exist.
import { describe, expect, it } from "vitest";
import {
  canDisableRequiresEvaluations,
  canDisableUsesLearningRoute,
} from "@/lib/academics/sectionFeatureFlagGuards";

describe("canDisableRequiresEvaluations", () => {
  it("allows disable when assessment count is zero", () => {
    expect(canDisableRequiresEvaluations({ assessmentCount: 0 })).toEqual({
      ok: true,
    });
  });

  it("blocks disable when assessments exist", () => {
    expect(canDisableRequiresEvaluations({ assessmentCount: 2 })).toEqual({
      ok: false,
      code: "has_evaluations",
    });
  });
});

describe("canDisableUsesLearningRoute", () => {
  it("allows disable when mode is free_flow or missing", () => {
    expect(canDisableUsesLearningRoute({ learningRouteMode: null })).toEqual({
      ok: true,
    });
    expect(canDisableUsesLearningRoute({ learningRouteMode: "free_flow" })).toEqual({
      ok: true,
    });
  });

  it("blocks disable when mode is route", () => {
    expect(canDisableUsesLearningRoute({ learningRouteMode: "route" })).toEqual({
      ok: false,
      code: "has_learning_route",
    });
  });
});
