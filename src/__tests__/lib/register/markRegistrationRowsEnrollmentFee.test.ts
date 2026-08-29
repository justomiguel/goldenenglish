/** @vitest-environment node */
import { describe, expect, it, vi } from "vitest";
import {
  collectSectionsChargingEnrollmentFee,
  markRegistrationRowsEnrollmentFee,
} from "@/lib/register/markRegistrationRowsEnrollmentFee";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";

describe("markRegistrationRowsEnrollmentFee", () => {
  it("flags a lead when a requested section charges matrícula", () => {
    const rows = markRegistrationRowsEnrollmentFee(
      [
        { preferred_section_id: A, additionalSectionIds: [], snapshotTotal: 0 },
        { preferred_section_id: B, additionalSectionIds: [], snapshotTotal: 0 },
      ],
      new Set([A]),
    );
    expect(rows[0]?.chargesEnrollmentFee).toBe(true);
    expect(rows[1]?.chargesEnrollmentFee).toBe(false);
  });

  it("flags a lead from a leftover fee snapshot even if live sections do not charge", () => {
    const rows = markRegistrationRowsEnrollmentFee(
      [{ preferred_section_id: A, additionalSectionIds: [], snapshotTotal: 80 }],
      new Set(),
    );
    expect(rows[0]?.chargesEnrollmentFee).toBe(true);
  });

  it("collects section ids whose effective enrollment fee is above zero", async () => {
    const inFn = vi.fn().mockResolvedValue({
      data: [
        { id: A, enrollment_fee_amount: 80, academic_cohorts: { default_enrollment_fee_amount: null } },
        { id: B, enrollment_fee_amount: null, academic_cohorts: { default_enrollment_fee_amount: 0 } },
      ],
      error: null,
    });
    const charging = await collectSectionsChargingEnrollmentFee(
      { from: () => ({ select: () => ({ in: inFn }) }) },
      [A, B],
    );
    expect(charging).toEqual(new Set([A]));
  });

  it("uses the cohort default when the section amount is unset", async () => {
    const inFn = vi.fn().mockResolvedValue({
      data: [
        { id: A, enrollment_fee_amount: null, academic_cohorts: { default_enrollment_fee_amount: 150 } },
      ],
      error: null,
    });
    const charging = await collectSectionsChargingEnrollmentFee(
      { from: () => ({ select: () => ({ in: inFn }) }) },
      [A],
    );
    expect(charging).toEqual(new Set([A]));
  });
});
