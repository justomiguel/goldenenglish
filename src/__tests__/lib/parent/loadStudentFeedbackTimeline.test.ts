import { describe, it, expect, vi, beforeEach } from "vitest";
import { loadStudentFeedbackTimeline } from "@/lib/parent/loadStudentFeedbackTimeline";

// REGRESSION CHECK: this loader is the only publish gate for cohort feedback — RLS lets
// guardians select draft grades, so dropping `.eq("status", "published")` would leak
// unfinished teacher notes to families.

type AnyRow = Record<string, unknown>;

const NOW = new Date("2026-08-07T12:00:00.000Z");

type Fixture = {
  enrollments?: AnyRow[];
  sections?: AnyRow[];
  grades?: AnyRow[];
  attempts?: AnyRow[];
  profiles?: AnyRow[];
};

/** Records every PostgREST filter so tests can assert on the query contract itself. */
function makeSupabaseMock(fixture: Fixture) {
  const calls: { table: string; filters: Record<string, unknown> }[] = [];

  const from = vi.fn((table: string) => {
    const filters: Record<string, unknown> = {};
    calls.push({ table, filters });

    const resolveData = () => {
      if (table === "section_enrollments") return fixture.enrollments ?? [];
      if (table === "academic_sections") return fixture.sections ?? [];
      if (table === "enrollment_assessment_grades") return fixture.grades ?? [];
      if (table === "student_assessment_attempts") return fixture.attempts ?? [];
      if (table === "profiles") return fixture.profiles ?? [];
      return [];
    };

    const builder: AnyRow = {
      then: (resolve: (value: { data: AnyRow[]; error: null }) => unknown) =>
        Promise.resolve({ data: resolveData(), error: null }).then(resolve),
    };

    for (const method of ["select", "eq", "in", "not", "neq", "order", "limit"]) {
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
  sections: [{ id: "sec-1", name: "B1 — Group A", teacher_id: "tea-1" }],
  profiles: [{ id: "tea-1", first_name: "Marta", last_name: "Ruiz" }],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("loadStudentFeedbackTimeline", () => {
  it("returns an empty timeline without querying when there is no student", async () => {
    const { supabase, calls } = makeSupabaseMock({});

    const timeline = await loadStudentFeedbackTimeline(supabase, {
      studentId: "",
      childLabel: "",
      now: NOW,
    });

    expect(timeline).toEqual({ items: [], newCount: 0 });
    expect(calls).toHaveLength(0);
  });

  it("reads published cohort feedback only", async () => {
    const { supabase, calls } = makeSupabaseMock({
      ...BASE_FIXTURE,
      grades: [
        {
          enrollment_id: "enr-1",
          assessment_id: "asm-1",
          score: 82,
          teacher_feedback: "Strong speaking, keep working on past tenses.",
          updated_at: "2026-08-05T09:00:00Z",
          cohort_assessments: { name: "Unit 3 exam", max_score: 100 },
        },
      ],
    });

    const timeline = await loadStudentFeedbackTimeline(supabase, {
      studentId: "stu-1",
      childLabel: "Adams, Zara",
      now: NOW,
    });

    const gradeCall = calls.find((call) => call.table === "enrollment_assessment_grades");
    expect(gradeCall?.filters.eq).toEqual(["status", "published"]);
    expect(gradeCall?.filters.not).toEqual(["teacher_feedback", "is", null]);
    expect(gradeCall?.filters.limit).toBeDefined();

    expect(timeline.items).toHaveLength(1);
    expect(timeline.items[0]).toMatchObject({
      source: "assessment",
      title: "Unit 3 exam",
      contextLabel: "B1 — Group A",
      teacherName: "Ruiz Marta",
      score: 82,
      maxScore: 100,
      feedback: "Strong speaking, keep working on past tenses.",
      isNew: true,
    });
  });

  it("skips the grades query entirely when the student has no enrollments", async () => {
    const { supabase, calls } = makeSupabaseMock({ enrollments: [] });

    await loadStudentFeedbackTimeline(supabase, {
      studentId: "stu-1",
      childLabel: "Adams, Zara",
      now: NOW,
    });

    expect(calls.some((call) => call.table === "enrollment_assessment_grades")).toBe(false);
  });

  it("reads reviewed learning attempts and excludes empty feedback at the query level", async () => {
    const { supabase, calls } = makeSupabaseMock({
      ...BASE_FIXTURE,
      attempts: [
        {
          id: "att-1",
          score: 70,
          teacher_feedback: "Nice effort on listening.",
          reviewed_at: "2026-08-04T10:00:00Z",
          updated_at: "2026-08-04T10:00:00Z",
          reviewed_by: "tea-1",
          learning_assessments: { title: "Listening check", section_id: "sec-1" },
        },
      ],
    });

    const timeline = await loadStudentFeedbackTimeline(supabase, {
      studentId: "stu-1",
      childLabel: "Adams, Zara",
      now: NOW,
    });

    const attemptCall = calls.find((call) => call.table === "student_assessment_attempts");
    expect(attemptCall?.filters.neq).toEqual(["teacher_feedback", ""]);

    expect(timeline.items[0]).toMatchObject({
      source: "learning",
      title: "Listening check",
      contextLabel: "B1 — Group A",
      teacherName: "Ruiz Marta",
      score: 70,
      maxScore: 100,
    });
  });

  it("merges both sources newest first and counts recent entries", async () => {
    const { supabase } = makeSupabaseMock({
      ...BASE_FIXTURE,
      grades: [
        {
          enrollment_id: "enr-1",
          assessment_id: "asm-1",
          score: 82,
          teacher_feedback: "Older exam note.",
          updated_at: "2026-05-01T09:00:00Z",
          cohort_assessments: { name: "Unit 1 exam", max_score: 100 },
        },
      ],
      attempts: [
        {
          id: "att-1",
          score: 70,
          teacher_feedback: "Fresh mini-test note.",
          reviewed_at: "2026-08-06T10:00:00Z",
          updated_at: "2026-08-06T10:00:00Z",
          reviewed_by: "tea-1",
          learning_assessments: { title: "Listening check", section_id: "sec-1" },
        },
      ],
    });

    const timeline = await loadStudentFeedbackTimeline(supabase, {
      studentId: "stu-1",
      childLabel: "Adams, Zara",
      now: NOW,
    });

    expect(timeline.items.map((item) => item.source)).toEqual(["learning", "assessment"]);
    expect(timeline.newCount).toBe(1);
  });

  it("drops rows whose teacher text is blank", async () => {
    const { supabase } = makeSupabaseMock({
      ...BASE_FIXTURE,
      grades: [
        {
          enrollment_id: "enr-1",
          assessment_id: "asm-1",
          score: 90,
          teacher_feedback: "   ",
          updated_at: "2026-08-05T09:00:00Z",
          cohort_assessments: { name: "Unit 3 exam", max_score: 100 },
        },
      ],
    });

    const timeline = await loadStudentFeedbackTimeline(supabase, {
      studentId: "stu-1",
      childLabel: "Adams, Zara",
      now: NOW,
    });

    expect(timeline.items).toEqual([]);
  });

  it("keeps rendering when a teacher profile cannot be resolved", async () => {
    const { supabase } = makeSupabaseMock({
      enrollments: [{ id: "enr-1", section_id: "sec-1" }],
      sections: [{ id: "sec-1", name: "B1 — Group A", teacher_id: "tea-missing" }],
      profiles: [],
      grades: [
        {
          enrollment_id: "enr-1",
          assessment_id: "asm-1",
          score: 82,
          teacher_feedback: "Good work.",
          updated_at: "2026-08-05T09:00:00Z",
          cohort_assessments: { name: "Unit 3 exam", max_score: 100 },
        },
      ],
    });

    const timeline = await loadStudentFeedbackTimeline(supabase, {
      studentId: "stu-1",
      childLabel: "Adams, Zara",
      now: NOW,
    });

    expect(timeline.items[0].teacherName).toBeNull();
    expect(timeline.items[0].feedback).toBe("Good work.");
  });
});
