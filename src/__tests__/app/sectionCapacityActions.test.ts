/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { updateAcademicSectionMaxStudentsAction } from "@/app/[locale]/dashboard/admin/academic/sectionCapacityActions";

const { mockAssertAdmin, recordSystemAudit, revalidatePath } = vi.hoisted(() => ({
  mockAssertAdmin: vi.fn(),
  recordSystemAudit: vi.fn().mockResolvedValue({ ok: true }),
  revalidatePath: vi.fn(),
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
  revalidateAcademicSurfaces: vi.fn(),
}));

describe("sectionCapacityActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates max_students when cap is >= active count", async () => {
    const countSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ count: 3, error: null }),
      }),
    });
    const sectionUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: "sec-1", cohort_id: "coh-1" },
            error: null,
          }),
        }),
      }),
    });
    const from = vi.fn((table: string) => {
      if (table === "section_enrollments") return { select: countSelect };
      if (table === "academic_sections") return { update: sectionUpdate };
      throw new Error(`Unexpected table ${table}`);
    });
    mockAssertAdmin.mockResolvedValue({ supabase: { from } });

    const r = await updateAcademicSectionMaxStudentsAction({
      locale: "es",
      sectionId: "00000000-0000-4000-8000-000000000001",
      maxStudents: 20,
    });
    expect(r).toEqual({ ok: true });
    expect(sectionUpdate).toHaveBeenCalled();
  });

  it("returns BELOW_ACTIVE when cap is under active enrollments", async () => {
    const countSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ count: 5, error: null }),
      }),
    });
    const from = vi.fn((table: string) => {
      if (table === "section_enrollments") return { select: countSelect };
      throw new Error(`Unexpected table ${table}`);
    });
    mockAssertAdmin.mockResolvedValue({ supabase: { from } });

    const r = await updateAcademicSectionMaxStudentsAction({
      locale: "es",
      sectionId: "00000000-0000-4000-8000-000000000001",
      maxStudents: 4,
    });
    expect(r).toEqual({ ok: false, code: "BELOW_ACTIVE" });
  });
});
