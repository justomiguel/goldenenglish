// REGRESSION CHECK: every Progress loader used to answer an empty list whether the ward had nothing
// or the read had failed, and the picker hides empty sections. A tutor whose RLS read timed out saw a
// screen that claimed their child had no exams and no feedback. These tests pin the loaders telling
// the caller when the answer is short because something broke.

import { describe, expect, it, vi } from "vitest";
import { loadStudentExamResults } from "@/lib/parent/loadStudentExamResults";
import { loadStudentFeedbackTimeline } from "@/lib/parent/loadStudentFeedbackTimeline";
import { loadStudentMiniTests } from "@/lib/learning-content/loadStudentMiniTests";

const TIMEOUT = { message: "canceling statement due to statement timeout", code: "57014" };

/**
 * Minimal PostgREST double: every builder method returns the chain, and awaiting it yields whatever
 * the table was configured to answer.
 */
function supabaseReturning(byTable: Record<string, { data: unknown[] | null; error?: unknown }>) {
  return {
    from(table: string) {
      const answer = byTable[table] ?? { data: [], error: null };
      const chain: Record<string, unknown> = {};
      const methods = ["select", "eq", "neq", "in", "not", "order", "limit", "gte", "lte", "is"];
      for (const method of methods) {
        chain[method] = () => chain;
      }
      chain.then = (resolve: (value: unknown) => unknown) =>
        Promise.resolve({ data: answer.data, error: answer.error ?? null }).then(resolve);
      chain.maybeSingle = () =>
        Promise.resolve({ data: answer.data?.[0] ?? null, error: answer.error ?? null });
      return chain;
    },
  } as never;
}

const ENROLLED = {
  section_enrollments: { data: [{ id: "enr-1", section_id: "sec-1", status: "active" }] },
  academic_sections: { data: [{ id: "sec-1", name: "ADVANCED", cohort_id: "coh-1", teacher_id: null }] },
};

describe("loadStudentExamResults reports a failed read", () => {
  it("calls onLoadError when the assessments read fails", async () => {
    const onLoadError = vi.fn();
    const supabase = supabaseReturning({
      ...ENROLLED,
      cohort_assessments: { data: null, error: TIMEOUT },
    });

    await loadStudentExamResults(supabase, { studentId: "stu-1", onLoadError });

    expect(onLoadError).toHaveBeenCalled();
    expect(String(onLoadError.mock.calls[0]![0])).toContain("loadStudentExamResults");
  });

  it("stays quiet when every read succeeds", async () => {
    const onLoadError = vi.fn();
    const supabase = supabaseReturning({
      ...ENROLLED,
      cohort_assessments: { data: [] },
      enrollment_assessment_grades: { data: [] },
    });

    await loadStudentExamResults(supabase, { studentId: "stu-1", onLoadError });

    expect(onLoadError).not.toHaveBeenCalled();
  });
});

describe("loadStudentFeedbackTimeline reports a failed read", () => {
  it("calls onLoadError when the grades read fails", async () => {
    const onLoadError = vi.fn();
    const supabase = supabaseReturning({
      ...ENROLLED,
      enrollment_assessment_grades: { data: null, error: TIMEOUT },
      student_assessment_attempts: { data: [] },
    });

    await loadStudentFeedbackTimeline(supabase, {
      studentId: "stu-1",
      childLabel: "Vera Luna",
      onLoadError,
    });

    expect(onLoadError).toHaveBeenCalled();
  });

  it("stays quiet when every read succeeds", async () => {
    const onLoadError = vi.fn();
    const supabase = supabaseReturning({
      ...ENROLLED,
      enrollment_assessment_grades: { data: [] },
      student_assessment_attempts: { data: [] },
    });

    await loadStudentFeedbackTimeline(supabase, {
      studentId: "stu-1",
      childLabel: "Vera Luna",
      onLoadError,
    });

    expect(onLoadError).not.toHaveBeenCalled();
  });
});

describe("loadStudentMiniTests stops discarding read errors", () => {
  it("calls onLoadError when the enrolments read fails", async () => {
    const onLoadError = vi.fn();
    const supabase = supabaseReturning({
      section_enrollments: { data: null, error: TIMEOUT },
    });

    await loadStudentMiniTests(supabase, "stu-1", onLoadError);

    expect(onLoadError).toHaveBeenCalled();
    expect(String(onLoadError.mock.calls[0]![0])).toContain("loadStudentMiniTests");
  });

  it("stays quiet on an honest empty result", async () => {
    const onLoadError = vi.fn();
    const supabase = supabaseReturning({ section_enrollments: { data: [] } });

    await loadStudentMiniTests(supabase, "stu-1", onLoadError);

    expect(onLoadError).not.toHaveBeenCalled();
  });
});
