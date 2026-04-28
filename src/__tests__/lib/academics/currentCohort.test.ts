import { describe, it, expect, vi } from "vitest";
import {
  loadCurrentCohort,
  loadCurrentCohortSections,
} from "@/lib/academics/currentCohort";

function mockSupabase(data: unknown, error: unknown = null) {
  const terminal = { maybeSingle: vi.fn().mockResolvedValue({ data, error }) };
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          is: vi.fn().mockReturnValue(terminal),
        }),
      }),
    }),
  } as unknown as Parameters<typeof loadCurrentCohort>[0];
}

describe("loadCurrentCohort", () => {
  it("returns cohort when is_current = true row exists", async () => {
    const cohort = {
      id: "c1",
      name: "2026",
      slug: "2026",
      starts_on: "2026-03-01",
      ends_on: "2026-11-30",
    };
    const result = await loadCurrentCohort(mockSupabase(cohort));
    expect(result).toEqual(cohort);
  });

  it("returns null when no current cohort", async () => {
    const result = await loadCurrentCohort(mockSupabase(null));
    expect(result).toBeNull();
  });

  it("returns null on error", async () => {
    const result = await loadCurrentCohort(
      mockSupabase(null, { message: "fail" }),
    );
    expect(result).toBeNull();
  });
});

function mockSupabaseSections(opts: {
  cohort: { id: string; name: string; slug: string | null; starts_on: string | null; ends_on: string | null } | null;
  sections?: Array<{
    id: string;
    name: string;
    max_students: number | null;
    profiles:
      | { first_name: string; last_name: string }
      | { first_name: string; last_name: string }[]
      | null;
  }>;
  enrollmentRows?: Array<{ section_id: string }>;
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
          order: vi.fn().mockResolvedValue({ data: opts.sections ?? null, error: null }),
        }),
      }),
    }),
  };
  const enrollmentsQuery = {
    select: vi.fn().mockReturnValue({
      in: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: opts.enrollmentRows ?? [], error: null }),
      }),
    }),
  };

  return {
    from: vi.fn((table: string) => {
      if (table === "academic_cohorts") return cohortQuery;
      if (table === "academic_sections") return sectionsQuery;
      if (table === "section_enrollments") return enrollmentsQuery;
      throw new Error(`unexpected table ${table}`);
    }),
  } as unknown as Parameters<typeof loadCurrentCohortSections>[0];
}

describe("loadCurrentCohortSections", () => {
  it("returns empty array when no current cohort", async () => {
    const r = await loadCurrentCohortSections(mockSupabaseSections({ cohort: null }));
    expect(r).toEqual([]);
  });

  it("returns empty array when cohort has no sections", async () => {
    const r = await loadCurrentCohortSections(
      mockSupabaseSections({
        cohort: { id: "c1", name: "2026", slug: null, starts_on: null, ends_on: null },
        sections: [],
      }),
    );
    expect(r).toEqual([]);
  });

  it("aggregates enrollment counts and resolves teacher names", async () => {
    const r = await loadCurrentCohortSections(
      mockSupabaseSections({
        cohort: { id: "c1", name: "2026", slug: null, starts_on: null, ends_on: null },
        sections: [
          {
            id: "s1",
            name: "A1",
            max_students: 12,
            profiles: { first_name: "Ada", last_name: "Lovelace" },
          },
          {
            id: "s2",
            name: "B1",
            max_students: null,
            profiles: [{ first_name: "Grace", last_name: "Hopper" }],
          },
          {
            id: "s3",
            name: "C1",
            max_students: 8,
            profiles: null,
          },
        ],
        enrollmentRows: [
          { section_id: "s1" },
          { section_id: "s1" },
          { section_id: "s2" },
        ],
      }),
    );

    expect(r).toHaveLength(3);
    expect(r[0]).toMatchObject({ id: "s1", teacherName: "Lovelace Ada", activeCount: 2, maxStudents: 12 });
    expect(r[1]).toMatchObject({ id: "s2", teacherName: "Hopper Grace", activeCount: 1 });
    expect(r[1].maxStudents).toBeGreaterThan(0);
    expect(r[2]).toMatchObject({ id: "s3", teacherName: "—", activeCount: 0, maxStudents: 8 });
  });
});
