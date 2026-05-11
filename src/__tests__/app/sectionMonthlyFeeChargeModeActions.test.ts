/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { updateAcademicSectionMonthlyFeeChargeModeAction } from "@/app/[locale]/dashboard/admin/academic/sectionMonthlyFeeChargeModeActions";

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

const SEC = "00000000-0000-4000-8000-000000000010";
const COH = "00000000-0000-4000-8000-000000000020";

function buildSupabase(opts: {
  sectionData?: { id: string; cohort_id: string } | null;
  updateError?: { message: string } | null;
} = {}) {
  const sectionData =
    "sectionData" in opts ? opts.sectionData : { id: SEC, cohort_id: COH };
  const updateError = opts.updateError ?? null;
  const update = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: updateError }),
  });
  const from = vi.fn((table: string) => {
    if (table !== "academic_sections") {
      throw new Error(`unexpected table ${table}`);
    }
    return {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi
            .fn()
            .mockResolvedValue({ data: sectionData, error: null }),
        }),
      }),
      update,
    };
  });
  return { from, update };
}

describe("updateAcademicSectionMonthlyFeeChargeModeAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects invalid mode with PARSE", async () => {
    mockAssertAdmin.mockResolvedValue({ supabase: { from: vi.fn() } });
    const res = await updateAcademicSectionMonthlyFeeChargeModeAction({
      locale: "en",
      sectionId: SEC,
      // deliberate invalid runtime value — Zod should reject before DB
      // @ts-expect-error — invalid discriminator for test-only
      monthlyFeeChargeMode: "bogus",
    });
    expect(res).toEqual({ ok: false, code: "PARSE" });
  });

  it("updates monthly_fee_charge_mode and records audit + revalidates", async () => {
    const { from, update } = buildSupabase();
    mockAssertAdmin.mockResolvedValue({ supabase: { from } });
    const res = await updateAcademicSectionMonthlyFeeChargeModeAction({
      locale: "en",
      sectionId: SEC,
      monthlyFeeChargeMode: "full_month_fee",
    });
    expect(res).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({ monthly_fee_charge_mode: "full_month_fee" });
    expect(recordSystemAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "academic_section_monthly_fee_charge_mode_updated",
        resourceType: "academic_section",
        resourceId: SEC,
        payload: expect.objectContaining({
          cohort_id: COH,
          monthly_fee_charge_mode: "full_month_fee",
        }),
      }),
    );
    expect(revalidateAcademicSurfaces).toHaveBeenCalledWith("en");
    expect(revalidatePath).toHaveBeenCalledWith(`/en/dashboard/admin/academic/${COH}/${SEC}`, "page");
    expect(revalidatePath).toHaveBeenCalledWith(
      `/en/dashboard/admin/finance/collections/${SEC}`,
      "page",
    );
    expect(revalidatePath).toHaveBeenCalledWith("/en/dashboard/student/payments", "page");
    expect(revalidatePath).toHaveBeenCalledWith("/en/dashboard/parent/payments", "page");
  });
});
