/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { updateAcademicSectionNameAction } from "@/app/[locale]/dashboard/admin/academic/sectionNameActions";

const { mockAssertAdmin, recordSystemAudit, revalidatePath, revalidateAcademicSurfaces } = vi.hoisted(() => ({
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

const SECTION_ID = "00000000-0000-4000-8000-000000000001";
const COHORT_ID = "00000000-0000-4000-8000-0000000000c1";

function mockFromForRename(opts: {
  currentName: string;
  siblings: { id: string; name: string }[];
  updateRow?: { id: string; cohort_id: string; name: string } | null;
  updateError?: unknown;
}) {
  const selectCurrent = {
    eq: vi.fn().mockReturnValue({
      maybeSingle: vi.fn().mockResolvedValue({
        data: { id: SECTION_ID, cohort_id: COHORT_ID, name: opts.currentName },
        error: null,
      }),
    }),
  };
  const selectSiblings = {
    eq: vi.fn().mockReturnValue({
      neq: vi.fn().mockResolvedValue({ data: opts.siblings, error: null }),
    }),
  };
  let selectCall = 0;
  const select = vi.fn(() => {
    selectCall += 1;
    return selectCall === 1 ? selectCurrent : selectSiblings;
  });
  const update = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({
          data:
            opts.updateRow !== undefined
              ? opts.updateRow
              : { id: SECTION_ID, cohort_id: COHORT_ID, name: "Nuevo nombre" },
          error: opts.updateError ?? null,
        }),
      }),
    }),
  });
  const from = vi.fn((table: string) => {
    if (table !== "academic_sections") throw new Error(`Unexpected table ${table}`);
    return { select, update };
  });
  mockAssertAdmin.mockResolvedValue({ supabase: { from } });
  return { update, from };
}

describe("updateAcademicSectionNameAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns PARSE for short names", async () => {
    const r = await updateAcademicSectionNameAction({
      locale: "es",
      sectionId: SECTION_ID,
      name: "A",
    });
    expect(r).toEqual({ ok: false, code: "PARSE" });
    expect(mockAssertAdmin).not.toHaveBeenCalled();
  });

  it("returns ok without update when name unchanged after trim", async () => {
    const { update } = mockFromForRename({
      currentName: "Alpha",
      siblings: [],
    });
    // Only first select (current row) should run; simplify by mocking select once:
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { id: SECTION_ID, cohort_id: COHORT_ID, name: "Alpha" },
      error: null,
    });
    const from = vi.fn(() => ({
      select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle }) }),
      update,
    }));
    mockAssertAdmin.mockResolvedValue({ supabase: { from } });

    const r = await updateAcademicSectionNameAction({
      locale: "es",
      sectionId: SECTION_ID,
      name: "  Alpha  ",
    });
    expect(r).toEqual({ ok: true });
    expect(update).not.toHaveBeenCalled();
    expect(recordSystemAudit).not.toHaveBeenCalled();
  });

  it("returns DUPLICATE when another section in cohort has same name case-insensitively", async () => {
    mockFromForRename({
      currentName: "Alpha",
      siblings: [{ id: "00000000-0000-4000-8000-000000000002", name: "beta" }],
    });
    const r = await updateAcademicSectionNameAction({
      locale: "es",
      sectionId: SECTION_ID,
      name: "Beta",
    });
    expect(r).toEqual({ ok: false, code: "DUPLICATE" });
  });

  it("updates name, audits, and revalidates on success", async () => {
    const { update } = mockFromForRename({
      currentName: "Alpha",
      siblings: [{ id: "00000000-0000-4000-8000-000000000002", name: "Other" }],
      updateRow: { id: SECTION_ID, cohort_id: COHORT_ID, name: "Nuevo nombre" },
    });
    const r = await updateAcademicSectionNameAction({
      locale: "es",
      sectionId: SECTION_ID,
      name: "Nuevo nombre",
    });
    expect(r).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({ name: "Nuevo nombre" });
    expect(recordSystemAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "academic_section_name_updated",
        resourceType: "academic_section",
        resourceId: SECTION_ID,
      }),
    );
    expect(revalidateAcademicSurfaces).toHaveBeenCalledWith("es");
    expect(revalidatePath).toHaveBeenCalled();
  });

  it("returns SAVE when update returns no row", async () => {
    mockFromForRename({
      currentName: "Alpha",
      siblings: [],
      updateRow: null,
    });
    const r = await updateAcademicSectionNameAction({
      locale: "es",
      sectionId: SECTION_ID,
      name: "Nuevo nombre",
    });
    expect(r).toEqual({ ok: false, code: "SAVE" });
  });
});
