import { describe, it, expect, vi } from "vitest";
import { loadParentChildrenSummaries } from "@/lib/parent/loadParentChildrenSummaries";

describe("loadParentChildrenSummaries", () => {
  it("returns empty when no tutor links", async () => {
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      })),
    };
    const r = await loadParentChildrenSummaries(supabase as never, "t1");
    expect(r).toEqual([]);
  });

  it("builds summary for linked student", async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "tutor_student_rel") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ student_id: "s1" }],
                error: null,
              }),
            }),
          };
        }
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: "s1",
                    first_name: "Ana",
                    last_name: "G",
                    next_exam_at: "2026-08-01",
                    student_portal_next_event_at: null,
                    student_portal_next_event_label: null,
                  },
                ],
                error: null,
              }),
            }),
          };
        }
        if (table === "section_enrollments") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [{ id: "en1" }],
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "section_attendance") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [
                  { attended_on: "2026-01-01", status: "present" },
                  { attended_on: "2026-01-02", status: "absent" },
                ],
                error: null,
              }),
            }),
          };
        }
        if (table === "enrollment_assessment_grades") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({
                  data: [
                    {
                      enrollment_id: "en1",
                      score: 8,
                      cohort_assessments: {
                        name: "Unit 1",
                        max_score: 10,
                        assessment_on: "2026-01-15",
                      },
                    },
                    {
                      enrollment_id: "en1",
                      score: 9,
                      cohort_assessments: {
                        name: "Unit 2",
                        max_score: 10,
                        assessment_on: "2026-02-20",
                      },
                    },
                  ],
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "enrollments") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: { courses: { level: "B1", name: "X" } },
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        throw new Error(`unexpected ${table}`);
      }),
    };

    const r = await loadParentChildrenSummaries(supabase as never, "t1");
    expect(r).toHaveLength(1);
    expect(r[0].studentId).toBe("s1");
    expect(r[0].firstName).toBe("Ana");
    expect(r[0].attendancePercent).toBe(50);
    expect(r[0].levelLabel).toBe("B1");
    expect(r[0].nextExamAt).toBe("2026-08-01");
    expect(r[0].assignedTeacherId).toBeNull();
    expect(r[0].assignedTeacherName).toBeNull();
    expect(r[0].lastPublishedGrade).toEqual({
      score: 9,
      maxScore: 10,
      assessmentName: "Unit 2",
      assessmentOn: "2026-02-20",
    });
  });

  it("resolves assigned teacher name when present", async () => {
    let profilesCall = 0;
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "tutor_student_rel") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [{ student_id: "s1" }], error: null }),
            }),
          };
        }
        if (table === "profiles") {
          profilesCall += 1;
          if (profilesCall === 1) {
            return {
              select: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({
                  data: [
                    {
                      id: "s1",
                      first_name: "Ana",
                      last_name: "G",
                      next_exam_at: null,
                      student_portal_next_event_at: null,
                      student_portal_next_event_label: null,
                      assigned_teacher_id: "t-teacher",
                    },
                  ],
                  error: null,
                }),
              }),
            };
          }
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [{ id: "t-teacher", first_name: "John", last_name: "Doe" }],
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "section_enrollments") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          };
        }
        if (table === "enrollments") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                  }),
                }),
              }),
            }),
          };
        }
        throw new Error(`unexpected ${table}`);
      }),
    };

    const r = await loadParentChildrenSummaries(supabase as never, "t1");
    expect(r).toHaveLength(1);
    expect(r[0].assignedTeacherId).toBe("t-teacher");
    expect(r[0].assignedTeacherName).toBe("Doe John");
    expect(r[0].lastPublishedGrade).toBeNull();
  });
});
