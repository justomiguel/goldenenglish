import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { runTeacherAttendanceCellsUpsert } from "@/lib/academics/teacherAttendanceMatrixMutations";

vi.mock("@/lib/academics/teacherSectionAttendanceCalendar", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/academics/teacherSectionAttendanceCalendar")>();
  return {
    ...actual,
    isTeacherAttendanceDateAllowedForSection: () => true,
  };
});

type SectionMeta = { starts_on: string | null; ends_on: string | null; schedule_slots: unknown };
type EnrollmentRow = {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
  section_id: string;
};

function mockSupabase(input: {
  section: SectionMeta;
  enrollments: EnrollmentRow[];
  upsertImpl?: (rows: unknown) => Promise<{ error: { message: string } | null }>;
}) {
  const upsertImpl =
    input.upsertImpl ?? (async () => ({ error: null as { message: string } | null }));
  const calls: { upsertRows?: unknown } = {};
  const supabase = {
    from: (table: string) => {
      if (table === "academic_sections") {
        return {
          select: () => ({
            eq: () => ({ maybeSingle: () => Promise.resolve({ data: input.section, error: null }) }),
          }),
        };
      }
      if (table === "section_enrollments") {
        return {
          select: () => ({
            eq: () => ({
              in: () => Promise.resolve({ data: input.enrollments, error: null }),
            }),
          }),
        };
      }
      if (table === "section_attendance") {
        return {
          upsert: (rows: unknown) => {
            calls.upsertRows = rows;
            return upsertImpl(rows);
          },
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
  } as unknown as SupabaseClient;
  return { supabase, calls };
}

describe("runTeacherAttendanceCellsUpsert — sectionStartsOn floor", () => {
  it("accepts upsert for a class day BEFORE active enrollment.created_at when section started earlier", async () => {
    const { supabase, calls } = mockSupabase({
      section: {
        starts_on: "2026-03-01",
        ends_on: "2026-11-30",
        schedule_slots: [{ dayOfWeek: 0, startTime: "10:00", endTime: "11:00" }],
      },
      enrollments: [
        {
          id: "enr-1",
          section_id: "sec-1",
          status: "active",
          created_at: "2026-04-01T00:00:00.000Z",
          updated_at: "2026-04-01T00:00:00.000Z",
        },
      ],
    });

    const result = await runTeacherAttendanceCellsUpsert(supabase, "teacher-1", "sec-1", [
      { enrollmentId: "enr-1", attendedOn: "2026-03-15", status: "present", notes: null },
    ]);

    expect(result.ok).toBe(true);
    expect(Array.isArray(calls.upsertRows)).toBe(true);
    expect((calls.upsertRows as Array<{ attended_on: string }>)[0]?.attended_on).toBe("2026-03-15");
  });

  it("rejects upsert for a transferred enrollment on a date BEFORE its created_at, even if section started earlier", async () => {
    const { supabase, calls } = mockSupabase({
      section: {
        starts_on: "2026-03-01",
        ends_on: "2026-11-30",
        schedule_slots: [{ dayOfWeek: 0, startTime: "10:00", endTime: "11:00" }],
      },
      enrollments: [
        {
          id: "enr-1",
          section_id: "sec-1",
          status: "transferred",
          created_at: "2026-04-01T00:00:00.000Z",
          updated_at: "2026-04-12T00:00:00.000Z",
        },
      ],
    });

    const result = await runTeacherAttendanceCellsUpsert(supabase, "teacher-1", "sec-1", [
      { enrollmentId: "enr-1", attendedOn: "2026-03-15", status: "present", notes: null },
    ]);

    expect(result).toEqual({ ok: false, code: "forbidden" });
    expect(calls.upsertRows).toBeUndefined();
  });
});
