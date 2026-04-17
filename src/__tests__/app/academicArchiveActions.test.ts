/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  archiveAcademicSectionAction,
  deleteAcademicSectionAction,
} from "@/app/[locale]/dashboard/admin/academic/sectionArchiveActions";
import { deleteAcademicCohortAction } from "@/app/[locale]/dashboard/admin/academic/cohortArchiveActions";

const { mockAssertAdmin, recordSystemAudit, revalidatePath, revalidateAcademicSurfaces } = vi.hoisted(
  () => ({
    mockAssertAdmin: vi.fn(),
    recordSystemAudit: vi.fn().mockResolvedValue({ ok: true }),
    revalidatePath: vi.fn(),
    revalidateAcademicSurfaces: vi.fn(),
  }),
);

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

describe("academic archive & delete actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("archiveAcademicSectionAction rejects when there are active enrollments", async () => {
    const enrollBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      then(onFulfilled: (v: { count: number; error: null }) => unknown) {
        return Promise.resolve(onFulfilled({ count: 1, error: null }));
      },
    };
    const from = vi.fn((table: string) => {
      if (table === "section_enrollments") return enrollBuilder;
      throw new Error(`Unexpected table ${table}`);
    });
    mockAssertAdmin.mockResolvedValue({ supabase: { from } });

    const sid = "00000000-0000-4000-8000-000000000099";
    const r = await archiveAcademicSectionAction({ locale: "en", sectionId: sid });
    expect(r).toEqual({ ok: false, code: "active_enrollments" });
  });

  it("deleteAcademicSectionAction rejects when any enrollment exists", async () => {
    const enrollBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      then(onFulfilled: (v: { count: number; error: null }) => unknown) {
        return Promise.resolve(onFulfilled({ count: 2, error: null }));
      },
    };
    const sectionMaybe = vi.fn().mockResolvedValue({
      data: { id: "s1", cohort_id: "c1" },
      error: null,
    });
    const sectionSelect = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: sectionMaybe }) });
    const from = vi.fn((table: string) => {
      if (table === "academic_sections") return { select: sectionSelect };
      if (table === "section_enrollments") return enrollBuilder;
      throw new Error(`Unexpected table ${table}`);
    });
    mockAssertAdmin.mockResolvedValue({ supabase: { from } });

    const sid = "00000000-0000-4000-8000-000000000099";
    const r = await deleteAcademicSectionAction({ locale: "en", sectionId: sid });
    expect(r).toEqual({ ok: false, code: "enrollments_exist" });
  });

  it("deleteAcademicSectionAction deletes when there are zero enrollments", async () => {
    const enrollBuilderZero = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      then(onFulfilled: (v: { count: number; error: null }) => unknown) {
        return Promise.resolve(onFulfilled({ count: 0, error: null }));
      },
    };
    const sectionMaybe = vi.fn().mockResolvedValue({
      data: { id: "s1", cohort_id: "c1" },
      error: null,
    });
    const sectionSelect = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: sectionMaybe }) });
    const deleteEq = vi.fn().mockResolvedValue({ error: null });
    const sectionDelete = vi.fn().mockReturnValue({ eq: deleteEq });
    const from = vi.fn((table: string) => {
      if (table === "academic_sections") {
        return { select: sectionSelect, delete: sectionDelete };
      }
      if (table === "section_enrollments") return enrollBuilderZero;
      throw new Error(`Unexpected table ${table}`);
    });
    mockAssertAdmin.mockResolvedValue({ supabase: { from } });

    const sid = "00000000-0000-4000-8000-000000000099";
    const r = await deleteAcademicSectionAction({ locale: "en", sectionId: sid });
    expect(r).toEqual({ ok: true, cohortId: "c1" });
    expect(sectionDelete).toHaveBeenCalled();
  });

  it("deleteAcademicCohortAction rejects when cohort is current", async () => {
    const cohortMaybe = vi.fn().mockResolvedValue({
      data: { id: "c1", is_current: true },
      error: null,
    });
    const cohortSelect = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: cohortMaybe }) });
    const from = vi.fn((table: string) => {
      if (table === "academic_cohorts") return { select: cohortSelect };
      throw new Error(`Unexpected table ${table}`);
    });
    mockAssertAdmin.mockResolvedValue({ supabase: { from } });

    const r = await deleteAcademicCohortAction({ locale: "en", cohortId: "00000000-0000-4000-8000-000000000001" });
    expect(r).toEqual({ ok: false, code: "is_current" });
  });
});
