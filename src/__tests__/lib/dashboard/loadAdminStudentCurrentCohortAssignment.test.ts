import { describe, expect, it, vi } from "vitest";
import { loadAdminStudentCurrentCohortAssignment } from "@/lib/dashboard/loadAdminStudentCurrentCohortAssignment";

const studentId = "00000000-0000-4000-8000-000000000010";

function mockSupabase(opts: {
  cohort: { id: string; name: string; slug: string | null; starts_on: string | null; ends_on: string | null } | null;
  sections?: Array<{
    id: string;
    name: string;
    max_students: number | null;
    teacher_id: string | null;
  }>;
  countRows?: Array<{ section_id: string }>;
  studentRows?: Array<{ id: string; section_id: string }>;
  teacherRows?: Array<{ id: string; first_name: string; last_name: string }>;
}) {
  const cohortQuery = {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        is: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: opts.cohort, error: null }),
        }),
      }),
    }),
  };
  const sectionsQuery = {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        is: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: opts.sections ?? [], error: null }),
        }),
      }),
    }),
  };
  const enrollmentQuery = {
    select: vi.fn().mockReturnValue({
      in: vi.fn().mockReturnValue({
        eq: vi.fn((_field: string, value: string) => {
          if (value === "active") {
            return Promise.resolve({ data: opts.countRows ?? [], error: null });
          }
          return {
            eq: vi.fn().mockResolvedValue({ data: opts.studentRows ?? [], error: null }),
          };
        }),
      }),
    }),
  };
  const profilesQuery = {
    select: vi.fn().mockReturnValue({
      in: vi.fn().mockResolvedValue({ data: opts.teacherRows ?? [], error: null }),
    }),
  };

  return {
    from: vi.fn((table: string) => {
      if (table === "academic_cohorts") return cohortQuery;
      if (table === "academic_sections") return sectionsQuery;
      if (table === "section_enrollments") return enrollmentQuery;
      if (table === "profiles") return profilesQuery;
      throw new Error(`unexpected table ${table}`);
    }),
  } as unknown as Parameters<typeof loadAdminStudentCurrentCohortAssignment>[0];
}

describe("loadAdminStudentCurrentCohortAssignment", () => {
  it("returns no current cohort state when none is marked current", async () => {
    const result = await loadAdminStudentCurrentCohortAssignment(
      mockSupabase({ cohort: null }),
      studentId,
    );

    expect(result).toEqual({
      cohortId: null,
      cohortName: null,
      sections: [],
      current: null,
      currentSections: [],
      hasMultipleCurrentAssignments: false,
    });
  });

  // REGRESSION CHECK: The student profile assignment card must stay scoped to
  // the active cohort and must not create a second active current-cohort row.
  it("loads active cohort sections and identifies the student's current section", async () => {
    const result = await loadAdminStudentCurrentCohortAssignment(
      mockSupabase({
        cohort: { id: "cohort-1", name: "2026", slug: null, starts_on: null, ends_on: null },
        sections: [
          {
            id: "section-a",
            name: "A1",
            max_students: 12,
            teacher_id: "teacher-a",
          },
          {
            id: "section-b",
            name: "B1",
            max_students: null,
            teacher_id: "teacher-b",
          },
        ],
        countRows: [{ section_id: "section-a" }, { section_id: "section-a" }],
        studentRows: [{ id: "enrollment-a", section_id: "section-a" }],
        teacherRows: [
          { id: "teacher-a", first_name: "Ada", last_name: "Lovelace" },
          { id: "teacher-b", first_name: "Grace", last_name: "Hopper" },
        ],
      }),
      studentId,
    );

    expect(result.cohortName).toBe("2026");
    expect(result.current).toEqual({
      enrollmentId: "enrollment-a",
      sectionId: "section-a",
      sectionName: "A1",
    });
    expect(result.currentSections).toEqual([
      { enrollmentId: "enrollment-a", sectionId: "section-a", sectionName: "A1" },
    ]);
    expect(result.sections[0]).toMatchObject({
      id: "section-a",
      name: "A1",
      teacherName: "Lovelace Ada",
      activeCount: 2,
      maxStudents: 12,
    });
    expect(result.sections[1]).toMatchObject({
      id: "section-b",
      teacherName: "Hopper Grace",
      activeCount: 0,
    });
  });
});
