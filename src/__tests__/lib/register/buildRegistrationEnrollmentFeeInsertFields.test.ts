/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildRegistrationEnrollmentFeeInsertFields } from "@/lib/register/buildRegistrationEnrollmentFeeInsertFields";

function mockAdmin(sectionRows: unknown[]) {
  const result = (data: unknown) => Promise.resolve({ data, error: null });
  const chain = (data: unknown) => {
    const api: Record<string, unknown> = {};
    const cont = () => api;
    api.select = cont;
    api.in = () => result(data);
    api.eq = cont;
    api.is = cont;
    api.order = cont;
    api.limit = () => result(data);
    api.maybeSingle = () => result(null);
    return api;
  };
  return {
    from: (table: string) =>
      chain(table === "academic_sections" ? sectionRows : []),
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

  it("does not open checkout when the family has not picked a schedule", async () => {
    const fields = await buildRegistrationEnrollmentFeeInsertFields({
      admin: mockAdmin([]),
      sectionIds: [],
      nowIso: "2026-08-10T15:00:00.000Z",
    });
    expect(fields.fee_snapshot.total).toBe(0);
    expect(fields.intake_state).toBe("needs_section");
  });

  it("adds the join month when the cohort has a monthly fee", async () => {
    const fields = await buildRegistrationEnrollmentFeeInsertFields({
      admin: mockAdmin([
        {
          id: "s1",
          name: "A1",
          enrollment_fee_amount: 80,
          billing_mode: "section_monthly_fee",
          starts_on: "2026-03-01",
          ends_on: "2026-12-31",
          schedule_slots: [{ dayOfWeek: 3, startTime: "18:00", endTime: "19:00" }],
          academic_cohorts: {
            enrollment_fee_mode: "per_section",
            default_enrollment_fee_amount: 0,
            default_monthly_fee: 40,
          },
        },
      ]),
      sectionIds: ["s1"],
      nowIso: "2026-08-10T15:00:00.000Z",
    });
    expect(fields.fee_snapshot.total).toBe(120);
    expect(fields.intake_state).toBe("awaiting_fee");
  });
});
