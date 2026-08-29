/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setSectionTrialOfferAction } from "@/app/[locale]/dashboard/admin/academic/sectionTrialOfferActions";

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
  const update = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: opts.updateError ?? null }),
  });
  const from = vi.fn((table: string) => {
    if (table !== "academic_sections") throw new Error(`unexpected table ${table}`);
    return {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: sectionData, error: null }),
        }),
      }),
      update,
    };
  });
  return { from, update };
}

describe("setSectionTrialOfferAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects invalid input with PARSE", async () => {
    const res = await setSectionTrialOfferAction({
      locale: "en",
      sectionId: "not-a-uuid",
      offersTrial: true,
      trialFeeAmount: 0,
    });
    expect(res).toEqual({ ok: false, code: "PARSE" });
  });

  it("rejects a negative amount with PARSE", async () => {
    const res = await setSectionTrialOfferAction({
      locale: "en",
      sectionId: SEC,
      offersTrial: true,
      trialFeeAmount: -1,
    });
    expect(res).toEqual({ ok: false, code: "PARSE" });
  });

  it("saves inherit (null) and a free override", async () => {
    const { from, update } = buildSupabase();
    mockAssertAdmin.mockResolvedValue({ supabase: { from } });
    const inherit = await setSectionTrialOfferAction({
      locale: "en",
      sectionId: SEC,
      offersTrial: null,
      trialFeeAmount: null,
    });
    expect(inherit).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({
      offers_trial: null,
      trial_fee_amount: null,
    });

    const free = await setSectionTrialOfferAction({
      locale: "en",
      sectionId: SEC,
      offersTrial: true,
      trialFeeAmount: 0,
    });
    expect(free).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({
      offers_trial: true,
      trial_fee_amount: 0,
    });
    expect(recordSystemAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "academic_section_trial_offer_updated",
        resourceId: SEC,
      }),
    );
    expect(revalidateAcademicSurfaces).toHaveBeenCalledWith("en");
    expect(revalidatePath).toHaveBeenCalledWith(
      `/en/dashboard/admin/academic/${COH}/${SEC}`,
      "page",
    );
  });
});
