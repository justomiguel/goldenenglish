// REGRESSION CHECK: Admin “marcar pagado” must use billingScope plan-year so amounts
// match Cobranzas matrices; operational proration-only would return out_of_period and block DB updates.
import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveSectionPlanMonthlyAmount } from "@/lib/billing/resolveSectionPlanMonthlyAmount";

const SECTION_ID = "00000000-0000-4000-8000-000000000001";
const STUDENT_ID = "00000000-0000-4000-8000-000000000002";

const planRow = {
  id: "p1",
  section_id: SECTION_ID,
  effective_from_year: 2026,
  effective_from_month: 1,
  monthly_fee: 90000,
  currency: "CLP",
  archived_at: null,
};

const enrollmentRow = { id: "enr1", created_at: "2026-02-01T12:00:00Z" };

const sectionRowEmptySchedule = {
  starts_on: "2026-01-01",
  ends_on: "2026-12-31",
  schedule_slots: [],
};

function createBillingSupabaseMock(academicSectionsPayload: unknown): SupabaseClient {
  const from = vi.fn((table: string) => {
    if (table === "section_fee_plans") {
      return {
        select: () => ({
          is: () => ({
            eq: () => Promise.resolve({ data: [planRow], error: null }),
          }),
        }),
      };
    }
    if (table === "section_enrollments") {
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: enrollmentRow, error: null }),
              }),
            }),
          }),
        }),
      };
    }
    if (table === "section_enrollment_scholarships") {
      return {
        select: () => ({
          eq: () => Promise.resolve({ data: [], error: null }),
        }),
      };
    }
    if (table === "academic_sections") {
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: academicSectionsPayload, error: null }),
          }),
        }),
      };
    }
    return {
      select: () => ({
        eq: () => Promise.resolve({ data: null, error: null }),
      }),
    };
  });
  return { from } as unknown as SupabaseClient;
}

describe("resolveSectionPlanMonthlyAmount", () => {
  it("plan-year: succeeds when operational calendar would yield out_of_period (no classes in month)", async () => {
    const supabase = createBillingSupabaseMock(sectionRowEmptySchedule);

    const r = await resolveSectionPlanMonthlyAmount(supabase, STUDENT_ID, SECTION_ID, 2026, 2, {
      billingScope: "plan-year",
    });
    expect(r.code).toBe("ok");
    if (r.code === "ok") {
      expect(r.amount).toBe(90000);
      expect(r.currency).toBe("CLP");
    }
    // REGRESSION CHECK: this used to assert that plan-year never reads `academic_sections`. It does
    // now, and it must: the section's `billing_mode` decides whether there is a monthly amount at all,
    // and a class-pack section must produce no amount in the admin matrices either. The plan-year
    // scope still ignores `schedule_slots` — that is what the amount assertions above pin down.
    expect(supabase.from).toHaveBeenCalledWith("academic_sections");
  });

  it("refuses a class-pack section in plan-year scope, so admin matrices show no monthly amount", async () => {
    const supabase = createBillingSupabaseMock({
      ...sectionRowEmptySchedule,
      billing_mode: "class_pack",
    });

    const r = await resolveSectionPlanMonthlyAmount(supabase, STUDENT_ID, SECTION_ID, 2026, 2, {
      billingScope: "plan-year",
    });
    expect(r.code).toBe("class_pack_section");
    // Short-circuits before the fee plan lookup: a class-pack section has no plan, and reporting
    // `no_plan` would make another billing product look like a misconfigured section.
    expect(supabase.from).not.toHaveBeenCalledWith("section_fee_plans");
  });

  it("refuses a class-pack section in operational-window scope", async () => {
    const supabase = createBillingSupabaseMock({
      ...sectionRowEmptySchedule,
      billing_mode: "class_pack",
    });

    const r = await resolveSectionPlanMonthlyAmount(supabase, STUDENT_ID, SECTION_ID, 2026, 2);
    expect(r.code).toBe("class_pack_section");
  });

  it("bills normally when billing_mode is absent or unrecognised, so no section silently stops being charged", async () => {
    const supabase = createBillingSupabaseMock({
      ...sectionRowEmptySchedule,
      billing_mode: "nonsense",
    });

    const r = await resolveSectionPlanMonthlyAmount(supabase, STUDENT_ID, SECTION_ID, 2026, 2);
    expect(r.code).toBe("ok");
  });

  it("operational-window: uses full-month fee like student strip when section overlaps month but class count is 0", async () => {
    const supabase = createBillingSupabaseMock(sectionRowEmptySchedule);

    const r = await resolveSectionPlanMonthlyAmount(supabase, STUDENT_ID, SECTION_ID, 2026, 2);
    expect(r.code).toBe("ok");
    if (r.code === "ok") {
      expect(r.amount).toBe(90000);
      expect(r.currency).toBe("CLP");
      expect(r.proration.full).toBe(true);
    }
    expect(supabase.from).toHaveBeenCalledWith("academic_sections");
  });
});
