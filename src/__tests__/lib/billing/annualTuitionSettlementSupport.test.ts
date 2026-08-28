/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { resolveSettlementEnrollmentFeeAmount } from "@/lib/billing/annualTuitionSettlementSupport";

describe("resolveSettlementEnrollmentFeeAmount", () => {
  it("inherits the cohort default when the section amount is null", () => {
    expect(
      resolveSettlementEnrollmentFeeAmount({
        id: "e",
        student_id: "st",
        section_id: "sec",
        enrollment_fee_exempt: false,
        academic_sections: {
          enrollment_fee_amount: null,
          academic_cohorts: { default_enrollment_fee_amount: 200 },
        },
      }),
    ).toBe(200);
  });

  it("keeps a stored section 0 even when the cohort has a default", () => {
    expect(
      resolveSettlementEnrollmentFeeAmount({
        id: "e",
        student_id: "st",
        section_id: "sec",
        enrollment_fee_exempt: false,
        academic_sections: {
          enrollment_fee_amount: 0,
          academic_cohorts: { default_enrollment_fee_amount: 200 },
        },
      }),
    ).toBe(0);
  });
});
