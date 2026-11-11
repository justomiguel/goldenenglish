import { describe, expect, it, vi } from "vitest";
import { loadAdminStudentCohortEnrollments } from "@/lib/dashboard/loadAdminStudentCohortEnrollments";
import { STUDENT_FICHA_COHORT_LIST_FAILED } from "@/lib/dashboard/studentFichaCohort";

const studentId = "00000000-0000-4000-8000-000000000010";

function enrollmentQuery(result: { data: unknown; error: { message: string } | null }) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    order: vi.fn(() => query),
    range: vi.fn(() => Promise.resolve(result)),
  };
  return query;
}

function inQuery(result: { data: unknown; error: { message: string } | null }) {
  const query = {
    select: vi.fn(() => query),
    in: vi.fn(() => Promise.resolve(result)),
  };
  return query;
}

describe("loadAdminStudentCohortEnrollments", () => {
  it("returns a past enrollment with its teacher", async () => {
    const enrollments = enrollmentQuery({
      data: [
        {
          id: "enr-1",
          status: "completed",
          created_at: "2025-04-01T00:00:00.000Z",
          section_id: "section-1",
          academic_sections: {
            name: "A1",
            teacher_id: "teacher-1",
            academic_cohorts: { id: "cohort-2025", name: "2025", is_current: false },
          },
        },
      ],
      error: null,
    });
    const assistants = inQuery({
      data: [{ section_id: "section-1", assistant_id: "assistant-1" }],
      error: null,
    });
    const profiles = inQuery({
      data: [
        { id: "teacher-1", first_name: "Ana", last_name: "Ruiz" },
        { id: "assistant-1", first_name: "Luis", last_name: "Paz" },
      ],
      error: null,
    });
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "section_enrollments") return enrollments;
        if (table === "academic_section_assistants") return assistants;
        if (table === "profiles") return profiles;
        throw new Error(`unexpected table ${table}`);
      }),
    };

    const result = await loadAdminStudentCohortEnrollments(
      supabase as never,
      studentId,
    );

    expect(result.code).toBeNull();
    expect(result.enrollments).toEqual([
      expect.objectContaining({
        enrollmentId: "enr-1",
        cohortId: "cohort-2025",
        cohortName: "2025",
        isCurrent: false,
        sectionName: "A1",
        status: "completed",
        teacher: { id: "teacher-1", name: "Ruiz Ana" },
      }),
    ]);
    expect(result.enrollments[0]?.assistants[0]?.name).toBe("Paz Luis");
  });

  it("returns cohort_list_failed when the enrollment read fails", async () => {
    const supabase = {
      from: vi.fn(() =>
        enrollmentQuery({ data: null, error: { message: "db down" } }),
      ),
    };

    const result = await loadAdminStudentCohortEnrollments(supabase as never, studentId);

    expect(result).toEqual({ enrollments: [], code: STUDENT_FICHA_COHORT_LIST_FAILED });
  });
});
