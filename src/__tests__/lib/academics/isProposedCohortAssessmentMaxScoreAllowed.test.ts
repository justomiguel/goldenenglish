import { describe, expect, it } from "vitest";
import { isProposedCohortAssessmentMaxScoreAllowed } from "@/lib/academics/isProposedCohortAssessmentMaxScoreAllowed";

describe("isProposedCohortAssessmentMaxScoreAllowed", () => {
  it("allows when proposed max is at or above highest stored grade", () => {
    expect(isProposedCohortAssessmentMaxScoreAllowed(10, 10)).toBe(true);
    expect(isProposedCohortAssessmentMaxScoreAllowed(10.5, 10)).toBe(true);
  });

  it("blocks when proposed max is below an existing grade", () => {
    expect(isProposedCohortAssessmentMaxScoreAllowed(8, 9)).toBe(false);
  });

  it("allows when there are no grades (max 0)", () => {
    expect(isProposedCohortAssessmentMaxScoreAllowed(1, 0)).toBe(true);
  });

  it("rejects non-finite inputs", () => {
    expect(isProposedCohortAssessmentMaxScoreAllowed(Number.NaN, 1)).toBe(false);
    expect(isProposedCohortAssessmentMaxScoreAllowed(10, Number.NaN)).toBe(false);
  });
});
