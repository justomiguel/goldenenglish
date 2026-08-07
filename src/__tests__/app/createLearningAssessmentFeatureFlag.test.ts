/** @vitest-environment node */
// REGRESSION CHECK: Creating section assessments must fail when
// requires_evaluations_to_pass is false.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createLearningAssessmentAction } from "@/app/[locale]/dashboard/admin/academic/contents/contentsQuestionAndAssessmentActions";

const { mockAssertAdmin } = vi.hoisted(() => ({
  mockAssertAdmin: vi.fn(),
}));

vi.mock("@/lib/dashboard/assertAdmin", () => ({
  assertAdmin: () => mockAssertAdmin(),
}));

vi.mock("@/lib/learning-content/auditLearningContentStaffAction", () => ({
  auditLearningContentStaffAction: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const SECTION_ID = "00000000-0000-4000-8000-000000000001";

describe("createLearningAssessmentAction feature flag", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns feature_disabled when requires_evaluations_to_pass is false", async () => {
    const from = vi.fn((table: string) => {
      if (table === "academic_sections") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  requires_evaluations_to_pass: false,
                  uses_learning_route: false,
                },
                error: null,
              }),
            }),
          }),
        };
      }
      throw new Error(`Unexpected table ${table}`);
    });
    mockAssertAdmin.mockResolvedValue({
      supabase: { from },
      user: { id: "admin-1" },
    });

    const r = await createLearningAssessmentAction({
      locale: "es",
      sectionId: SECTION_ID,
      title: "Entry check",
      assessmentKind: "entry",
      gradingMode: "pass_fail",
    });
    expect(r).toEqual({ ok: false, code: "feature_disabled" });
  });
});
