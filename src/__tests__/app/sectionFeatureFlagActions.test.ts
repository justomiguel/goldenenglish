/** @vitest-environment node */
// REGRESSION CHECK: Feature-flag disable must fail closed when assessments or
// mode=route assignment exist; enable and empty disable must succeed.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { updateAcademicSectionFeatureFlagsAction } from "@/app/[locale]/dashboard/admin/academic/sectionFeatureFlagActions";

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

const SECTION_ID = "00000000-0000-4000-8000-000000000001";

function sectionSelect(row: {
  requires_evaluations_to_pass: boolean;
  uses_learning_route: boolean;
}) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: SECTION_ID,
            cohort_id: "00000000-0000-4000-8000-000000000099",
            ...row,
          },
          error: null,
        }),
      }),
    }),
  };
}

describe("updateAcademicSectionFeatureFlagsAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function updateReturningRow(row: { id: string } | null) {
    return vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: row, error: null }),
        }),
      }),
    });
  }

  it("enables both flags without guard queries beyond section load", async () => {
    const update = updateReturningRow({ id: SECTION_ID });
    const from = vi.fn((table: string) => {
      if (table === "academic_sections") {
        return {
          ...sectionSelect({
            requires_evaluations_to_pass: false,
            uses_learning_route: false,
          }),
          update,
        };
      }
      throw new Error(`Unexpected table ${table}`);
    });
    mockAssertAdmin.mockResolvedValue({ supabase: { from } });

    const r = await updateAcademicSectionFeatureFlagsAction({
      locale: "es",
      sectionId: SECTION_ID,
      requiresEvaluationsToPass: true,
      usesLearningRoute: true,
    });
    expect(r).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({
      requires_evaluations_to_pass: true,
      uses_learning_route: true,
    });
    expect(recordSystemAudit).toHaveBeenCalled();
  });

  it("returns SAVE when update matches no row", async () => {
    const update = updateReturningRow(null);
    const from = vi.fn((table: string) => {
      if (table === "academic_sections") {
        return {
          ...sectionSelect({
            requires_evaluations_to_pass: false,
            uses_learning_route: false,
          }),
          update,
        };
      }
      throw new Error(`Unexpected table ${table}`);
    });
    mockAssertAdmin.mockResolvedValue({ supabase: { from } });

    const r = await updateAcademicSectionFeatureFlagsAction({
      locale: "es",
      sectionId: SECTION_ID,
      requiresEvaluationsToPass: true,
      usesLearningRoute: false,
    });
    expect(r).toEqual({ ok: false, code: "SAVE" });
    expect(recordSystemAudit).not.toHaveBeenCalled();
  });

  it("blocks disabling evaluations when assessments exist", async () => {
    const from = vi.fn((table: string) => {
      if (table === "academic_sections") {
        return sectionSelect({
          requires_evaluations_to_pass: true,
          uses_learning_route: false,
        });
      }
      if (table === "learning_assessments") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ count: 1, error: null }),
          }),
        };
      }
      throw new Error(`Unexpected table ${table}`);
    });
    mockAssertAdmin.mockResolvedValue({ supabase: { from } });

    const r = await updateAcademicSectionFeatureFlagsAction({
      locale: "es",
      sectionId: SECTION_ID,
      requiresEvaluationsToPass: false,
      usesLearningRoute: false,
    });
    expect(r).toEqual({ ok: false, code: "has_evaluations" });
  });

  it("blocks disabling learning route when mode is route", async () => {
    const from = vi.fn((table: string) => {
      if (table === "academic_sections") {
        return sectionSelect({
          requires_evaluations_to_pass: false,
          uses_learning_route: true,
        });
      }
      if (table === "section_learning_routes") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { mode: "route" },
                error: null,
              }),
            }),
          }),
        };
      }
      throw new Error(`Unexpected table ${table}`);
    });
    mockAssertAdmin.mockResolvedValue({ supabase: { from } });

    const r = await updateAcademicSectionFeatureFlagsAction({
      locale: "es",
      sectionId: SECTION_ID,
      requiresEvaluationsToPass: false,
      usesLearningRoute: false,
    });
    expect(r).toEqual({ ok: false, code: "has_learning_route" });
  });

  it("allows disabling learning route when mode is free_flow", async () => {
    const update = updateReturningRow({ id: SECTION_ID });
    const from = vi.fn((table: string) => {
      if (table === "academic_sections") {
        return {
          ...sectionSelect({
            requires_evaluations_to_pass: false,
            uses_learning_route: true,
          }),
          update,
        };
      }
      if (table === "section_learning_routes") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { mode: "free_flow" },
                error: null,
              }),
            }),
          }),
        };
      }
      throw new Error(`Unexpected table ${table}`);
    });
    mockAssertAdmin.mockResolvedValue({ supabase: { from } });

    const r = await updateAcademicSectionFeatureFlagsAction({
      locale: "es",
      sectionId: SECTION_ID,
      requiresEvaluationsToPass: false,
      usesLearningRoute: false,
    });
    expect(r).toEqual({ ok: true });
  });
});
