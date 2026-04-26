// REGRESSION CHECK: Admin section “Evaluaciones” tab uses aggregate counts; wrong
// filters (section vs cohort) would show misleading published / attempt numbers.
import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadAdminSectionAssessmentsPanelData } from "@/lib/academics/loadAdminSectionAssessmentsPanelData";

function makeClient(learningData: unknown, attemptData: unknown, cohortData: unknown, gradeData: unknown) {
  const from = vi.fn((table: string) => {
    if (table === "learning_assessments") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: learningData, error: null }),
            }),
          }),
        }),
      };
    }
    if (table === "student_assessment_attempts" || table === "enrollment_assessment_grades") {
      return {
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({ data: table === "student_assessment_attempts" ? attemptData : gradeData, error: null }),
        }),
      };
    }
    if (table === "cohort_assessments") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: cohortData, error: null }),
            }),
          }),
        }),
      };
    }
    return { select: vi.fn() };
  });
  return { from: from as SupabaseClient["from"] } as SupabaseClient;
}

describe("loadAdminSectionAssessmentsPanelData", () => {
  it("merges learning assessments with attempt aggregates and cohort published counts", async () => {
    const supabase = makeClient(
      [
        {
          id: "a1",
          title: "Entry",
          assessment_kind: "entry",
          grading_mode: "numeric",
          passing_score: 60,
          created_at: "2026-01-01T00:00:00Z",
        },
      ],
      [
        { assessment_id: "a1", score: 80, passed: true, status: "reviewed" },
        { assessment_id: "a1", score: 50, passed: false, status: "submitted" },
      ],
      [
        { id: "c1", name: "Final", assessment_on: "2026-06-01", max_score: 100 },
      ],
      [
        { assessment_id: "c1", status: "published" },
        { assessment_id: "c1", status: "draft" },
      ],
    );
    const out = await loadAdminSectionAssessmentsPanelData(
      supabase,
      "sec-1",
      "coh-1",
      ["e1", "e2"],
    );
    expect(out.learning[0]!.id).toBe("a1");
    expect(out.learning[0]!.attemptCount).toBe(2);
    expect(out.learning[0]!.reviewedCount).toBe(1);
    expect(out.learning[0]!.avgScore).toBe(65);
    expect(out.cohort[0]!.id).toBe("c1");
    expect(out.cohort[0]!.publishedInSection).toBe(1);
    expect(out.activeEnrollmentCount).toBe(2);
  });
});
