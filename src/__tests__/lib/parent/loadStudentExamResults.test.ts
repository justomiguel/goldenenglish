// REGRESSION CHECK: the loader that finally puts a teacher's evaluación on the family's Progress
// screen. Contract: exams come from the student's COHORTS (so an exam with no grade still shows),
// and only `status = 'published'` grades may contribute a score — RLS lets guardians read drafts, so
// dropping that filter would leak unfinished marks.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { loadStudentExamResults } from "@/lib/parent/loadStudentExamResults";

type AnyRow = Record<string, unknown>;

const NOW = new Date("2026-08-07T12:00:00.000Z");

type Fixture = {
  enrollments?: AnyRow[];
  sections?: AnyRow[];
  assessments?: AnyRow[];
  grades?: AnyRow[];
};

function makeSupabaseMock(fixture: Fixture) {
  const calls: { table: string; filters: Record<string, unknown> }[] = [];

  const from = vi.fn((table: string) => {
    const filters: Record<string, unknown> = {};
    calls.push({ table, filters });

    const resolveData = () => {
      if (table === "section_enrollments") return fixture.enrollments ?? [];
      if (table === "academic_sections") return fixture.sections ?? [];
      if (table === "cohort_assessments") return fixture.assessments ?? [];
      if (table === "enrollment_assessment_grades") return fixture.grades ?? [];
      return [];
    };

    const builder: AnyRow = {
      then: (resolve: (value: { data: AnyRow[]; error: null }) => unknown) =>
        Promise.resolve({ data: resolveData(), error: null }).then(resolve),
    };

    for (const method of ["select", "eq", "in", "order", "limit"]) {
      builder[method] = vi.fn((...args: unknown[]) => {
        filters[method] = args;
        return builder;
      });
    }

    return builder;
  });

  return { supabase: { from } as never, calls };
}

const BASE_FIXTURE: Fixture = {
  enrollments: [{ id: "enr-1", section_id: "sec-1" }],
  sections: [{ id: "sec-1", name: "B1 — Group A", cohort_id: "cohort-1" }],
  assessments: [
    { id: "asm-1", cohort_id: "cohort-1", name: "Unit 3 exam", assessment_on: "2026-08-05", max_score: 10 },
  ],
};

function callFor(calls: { table: string; filters: Record<string, unknown> }[], table: string) {
  return calls.find((call) => call.table === table);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("loadStudentExamResults", () => {
  it("returns nothing without querying when there is no student", async () => {
    const { supabase, calls } = makeSupabaseMock({});

    expect(await loadStudentExamResults(supabase, { studentId: "", now: NOW })).toEqual([]);
    expect(calls).toHaveLength(0);
  });

  it("returns nothing when the student has no active enrollment", async () => {
    const { supabase } = makeSupabaseMock({ enrollments: [] });

    expect(await loadStudentExamResults(supabase, { studentId: "stu-1", now: NOW })).toEqual([]);
  });

  it("lists an exam that nobody has graded yet", async () => {
    const { supabase } = makeSupabaseMock(BASE_FIXTURE);

    const exams = await loadStudentExamResults(supabase, { studentId: "stu-1", now: NOW });

    expect(exams).toHaveLength(1);
    expect(exams[0]).toMatchObject({
      id: "asm-1",
      name: "Unit 3 exam",
      sectionName: "B1 — Group A",
      examOn: "2026-08-05",
      score: null,
      state: "pending",
    });
  });

  it("attaches a published grade to its exam", async () => {
    const { supabase } = makeSupabaseMock({
      ...BASE_FIXTURE,
      grades: [
        { assessment_id: "asm-1", score: 8, teacher_feedback: "Great progress" },
      ],
    });

    const exams = await loadStudentExamResults(supabase, { studentId: "stu-1", now: NOW });

    expect(exams[0]).toMatchObject({
      score: 8,
      maxScore: 10,
      hasTeacherFeedback: true,
      state: "graded",
    });
  });

  it("does not treat whitespace as a teacher comment", async () => {
    const { supabase } = makeSupabaseMock({
      ...BASE_FIXTURE,
      grades: [{ assessment_id: "asm-1", score: 8, teacher_feedback: "   " }],
    });

    const exams = await loadStudentExamResults(supabase, { studentId: "stu-1", now: NOW });

    expect(exams[0]?.hasTeacherFeedback).toBe(false);
  });

  it("asks the database for published grades only", async () => {
    const { supabase, calls } = makeSupabaseMock(BASE_FIXTURE);

    await loadStudentExamResults(supabase, { studentId: "stu-1", now: NOW });

    const grades = callFor(calls, "enrollment_assessment_grades");
    expect(grades?.filters.eq).toEqual(["status", "published"]);
  });

  it("scopes exams to the cohorts the student is enrolled in", async () => {
    const { supabase, calls } = makeSupabaseMock(BASE_FIXTURE);

    await loadStudentExamResults(supabase, { studentId: "stu-1", now: NOW });

    const assessments = callFor(calls, "cohort_assessments");
    expect(assessments?.filters.in).toEqual(["cohort_id", ["cohort-1"]]);
  });

  it("bounds every query it issues", async () => {
    const { supabase, calls } = makeSupabaseMock(BASE_FIXTURE);

    await loadStudentExamResults(supabase, { studentId: "stu-1", now: NOW });

    for (const call of calls) {
      expect(call.filters.limit, `${call.table} must be bounded`).toBeDefined();
    }
  });

  it("skips the exam query when no section resolves to a cohort", async () => {
    const { supabase, calls } = makeSupabaseMock({
      enrollments: [{ id: "enr-1", section_id: "sec-1" }],
      sections: [{ id: "sec-1", name: "B1", cohort_id: null }],
    });

    expect(await loadStudentExamResults(supabase, { studentId: "stu-1", now: NOW })).toEqual([]);
    expect(callFor(calls, "cohort_assessments")).toBeUndefined();
  });
});
