/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildRegistrationEnrollmentFeeInsertFields } from "@/lib/register/buildRegistrationEnrollmentFeeInsertFields";

function mockAdmin(sectionRows: unknown[]) {
  return {
    from: () => ({
      select: () => ({
        in: async () => ({ data: sectionRows, error: null }),
        eq: () => ({
          maybeSingle: async () => ({ data: null, error: null }),
        }),
      }),
    }),
  } as unknown as SupabaseClient;
}

describe("buildRegistrationEnrollmentFeeInsertFields", () => {
  it("inherits the cohort enrollment default when the section amount is null", async () => {
    const fields = await buildRegistrationEnrollmentFeeInsertFields({
      admin: mockAdmin([
        {
          id: "s1",
          name: "A1",
          enrollment_fee_amount: null,
          academic_cohorts: {
            enrollment_fee_mode: "per_section",
            default_enrollment_fee_amount: 150,
          },
        },
      ]),
      sectionIds: ["s1"],
      nowIso: "2026-08-28T00:00:00.000Z",
    });
    expect(fields.fee_snapshot.total).toBe(150);
    expect(fields.fee_snapshot.lines[0]?.amount).toBe(150);
    expect(fields.intake_state).toBe("awaiting_fee");
  });

  it("keeps a stored section 0 even when the cohort has a default", async () => {
    const fields = await buildRegistrationEnrollmentFeeInsertFields({
      admin: mockAdmin([
        {
          id: "s1",
          name: "A1",
          enrollment_fee_amount: 0,
          academic_cohorts: {
            enrollment_fee_mode: "per_section",
            default_enrollment_fee_amount: 150,
          },
        },
      ]),
      sectionIds: ["s1"],
      nowIso: "2026-08-28T00:00:00.000Z",
    });
    expect(fields.fee_snapshot.total).toBe(0);
    expect(fields.intake_state).toBe("none");
  });
});
