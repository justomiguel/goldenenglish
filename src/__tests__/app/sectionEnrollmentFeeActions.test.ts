/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setSectionEnrollmentFeeAmountAction } from "@/app/[locale]/dashboard/admin/academic/sectionEnrollmentFeeActions";

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

interface BuildOpts {
  sectionData?: { id: string; cohort_id: string } | null;
  updateError?: { message: string } | null;
}

function buildSupabase(opts: BuildOpts = {}) {
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

describe("setSectionEnrollmentFeeAmountAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects invalid input with PARSE", async () => {
    mockAssertAdmin.mockResolvedValue({ supabase: { from: vi.fn() } });
    const res = await setSectionEnrollmentFeeAmountAction({
      locale: "en",
      sectionId: "not-a-uuid",
      enrollmentFeeAmount: 100,
    });
    expect(res).toEqual({ ok: false, code: "PARSE" });
  });

  it("rejects negative amounts with PARSE", async () => {
    mockAssertAdmin.mockResolvedValue({ supabase: { from: vi.fn() } });
    const res = await setSectionEnrollmentFeeAmountAction({
      locale: "en",
      sectionId: SEC,
      enrollmentFeeAmount: -1,
    });
    expect(res).toEqual({ ok: false, code: "PARSE" });
  });

  it("returns SAVE when the section is not found", async () => {
    const { from } = buildSupabase({ sectionData: null });
    mockAssertAdmin.mockResolvedValue({ supabase: { from } });
    const res = await setSectionEnrollmentFeeAmountAction({
      locale: "en",
      sectionId: SEC,
      enrollmentFeeAmount: 0,
    });
    expect(res).toEqual({ ok: false, code: "SAVE" });
  });

  it("updates the column and records audit + revalidates", async () => {
    const { from, update } = buildSupabase();
    mockAssertAdmin.mockResolvedValue({ supabase: { from } });
    const res = await setSectionEnrollmentFeeAmountAction({
      locale: "en",
      sectionId: SEC,
      enrollmentFeeAmount: 250,
    });
    expect(res).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({ enrollment_fee_amount: 250 });
    expect(recordSystemAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "academic_section_enrollment_fee_updated",
        resourceType: "academic_section",
        resourceId: SEC,
        payload: expect.objectContaining({
          cohort_id: COH,
          enrollment_fee_amount: 250,
        }),
      }),
    );
    expect(revalidateAcademicSurfaces).toHaveBeenCalledWith("en");
    expect(revalidatePath).toHaveBeenCalledWith(
      `/en/dashboard/admin/academic/${COH}/${SEC}`,
      "page",
    );
    expect(revalidatePath).toHaveBeenCalledWith(
      "/en/dashboard/student/payments",
      "page",
    );
  });

  it("returns SAVE when supabase update errors", async () => {
    const { from } = buildSupabase({ updateError: { message: "boom" } });
    mockAssertAdmin.mockResolvedValue({ supabase: { from } });
    const res = await setSectionEnrollmentFeeAmountAction({
      locale: "en",
      sectionId: SEC,
      enrollmentFeeAmount: 100,
    });
    expect(res).toEqual({ ok: false, code: "SAVE" });
    expect(recordSystemAudit).not.toHaveBeenCalled();
  });

  it("accepts 0 as a valid amount (section does not charge enrollment)", async () => {
    const { from, update } = buildSupabase();
    mockAssertAdmin.mockResolvedValue({ supabase: { from } });
    const res = await setSectionEnrollmentFeeAmountAction({
      locale: "en",
      sectionId: SEC,
      enrollmentFeeAmount: 0,
    });
    expect(res).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({ enrollment_fee_amount: 0 });
  });
});
