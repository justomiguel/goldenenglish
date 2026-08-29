/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { updateAcademicCohortFeeDefaultsAction } from "@/app/[locale]/dashboard/admin/academic/cohortFeeDefaultsActions";

const { mockAssertAdmin, recordSystemAudit, revalidatePath, revalidateAcademicSurfaces } =
  vi.hoisted(() => ({
    mockAssertAdmin: vi.fn(),
    recordSystemAudit: vi.fn().mockResolvedValue({ ok: true }),
    revalidatePath: vi.fn(),
    revalidateAcademicSurfaces: vi.fn(),
  }));

vi.mock("@/lib/dashboard/assertAdmin", () => ({
  assertAdmin: () => mockAssertAdmin(),
}));

vi.mock("@/lib/analytics/server/recordSystemAudit", () => ({
  recordSystemAudit,
}));

vi.mock("next/cache", () => ({
  revalidatePath,
}));

vi.mock("@/app/[locale]/dashboard/admin/academic/revalidatePaths", () => ({
  revalidateAcademicSurfaces,
}));

const COH = "00000000-0000-4000-8000-000000000020";

function buildSupabase(opts: {
  archivedAt?: string | null;
  missing?: boolean;
  updateError?: { message: string } | null;
} = {}) {
  const update = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: opts.updateError ?? null }),
  });
  const from = vi.fn((table: string) => {
    if (table !== "academic_cohorts") throw new Error(`unexpected table ${table}`);
    return {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: opts.missing ? null : { id: COH, archived_at: opts.archivedAt ?? null },
            error: null,
          }),
        }),
      }),
      update,
    };
  });
  return { from, update };
}

describe("updateAcademicCohortFeeDefaultsAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a non-uuid cohort with PARSE", async () => {
    const res = await updateAcademicCohortFeeDefaultsAction({
      locale: "en",
      cohortId: "nope",
      defaultEnrollmentFeeAmount: 10,
      defaultMonthlyFee: 20,
    });
    expect(res).toEqual({ ok: false, code: "PARSE" });
  });

  it("rejects a negative amount with PARSE", async () => {
    const res = await updateAcademicCohortFeeDefaultsAction({
      locale: "en",
      cohortId: COH,
      defaultEnrollmentFeeAmount: -1,
      defaultMonthlyFee: null,
    });
    expect(res).toEqual({ ok: false, code: "PARSE" });
  });

  it("rejects an archived cohort", async () => {
    const { from, update } = buildSupabase({ archivedAt: "2026-01-01T00:00:00Z" });
    mockAssertAdmin.mockResolvedValue({ supabase: { from } });
    const res = await updateAcademicCohortFeeDefaultsAction({
      locale: "en",
      cohortId: COH,
      defaultEnrollmentFeeAmount: 10,
      defaultMonthlyFee: 20,
    });
    expect(res).toEqual({ ok: false, code: "ARCHIVED" });
    expect(update).not.toHaveBeenCalled();
  });

  it("rejects once_for_all when section amounts differ", async () => {
    const update = vi.fn();
    const from = vi.fn((table: string) => {
      if (table === "academic_sections") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              is: vi.fn().mockResolvedValue({
                data: [{ enrollment_fee_amount: 80 }, { enrollment_fee_amount: 120 }],
                error: null,
              }),
            }),
          }),
        };
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: COH, archived_at: null },
              error: null,
            }),
          }),
        }),
        update,
      };
    });
    mockAssertAdmin.mockResolvedValue({ supabase: { from } });
    const res = await updateAcademicCohortFeeDefaultsAction({
      locale: "en",
      cohortId: COH,
      defaultEnrollmentFeeAmount: 10,
      defaultMonthlyFee: 20,
      enrollmentFeeMode: "once_for_all",
    });
    expect(res).toEqual({ ok: false, code: "ONCE_FOR_ALL" });
    expect(update).not.toHaveBeenCalled();
  });

  it("saves defaults and clears them to null", async () => {
    const { from, update } = buildSupabase();
    mockAssertAdmin.mockResolvedValue({ supabase: { from } });
    const res = await updateAcademicCohortFeeDefaultsAction({
      locale: "en",
      cohortId: COH,
      defaultEnrollmentFeeAmount: 150,
      defaultMonthlyFee: null,
    });
    expect(res).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({
      default_enrollment_fee_amount: 150,
      default_monthly_fee: null,
      enrollment_fee_mode: "per_section",
    });
    expect(recordSystemAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "academic_cohort_fee_defaults_updated",
        resourceId: COH,
      }),
    );
    expect(revalidateAcademicSurfaces).toHaveBeenCalledWith("en");
  });

  it("saves trial offer fields when provided", async () => {
    const { from, update } = buildSupabase();
    mockAssertAdmin.mockResolvedValue({ supabase: { from } });
    const res = await updateAcademicCohortFeeDefaultsAction({
      locale: "en",
      cohortId: COH,
      defaultEnrollmentFeeAmount: null,
      defaultMonthlyFee: null,
      offersTrial: true,
      trialFeeAmount: 0,
    });
    expect(res).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({
      default_enrollment_fee_amount: null,
      default_monthly_fee: null,
      enrollment_fee_mode: "per_section",
      offers_trial: true,
      trial_fee_amount: 0,
    });
  });
});
