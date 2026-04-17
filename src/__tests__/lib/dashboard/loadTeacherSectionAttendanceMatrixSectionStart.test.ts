import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadTeacherSectionAttendanceMatrix } from "@/lib/dashboard/loadTeacherSectionAttendanceMatrix";

function mockSupabase(input: {
  enrollments: {
    id: string;
    student_id: string;
    status: string;
    created_at: string;
    updated_at: string;
    profiles: { first_name: string; last_name: string } | null;
  }[];
  attendance?: { enrollment_id: string; attended_on: string; status: string }[];
}): SupabaseClient {
  const att = input.attendance ?? [];
  return {
    from: (table: string) => {
      if (table === "section_enrollments") {
        return {
          select: () => ({
            eq: () => ({
              order: () => Promise.resolve({ data: input.enrollments, error: null }),
            }),
          }),
        };
      }
      if (table === "section_attendance") {
        return {
          select: () => ({
            in: () => ({
              gte: () => ({
                lte: () => Promise.resolve({ data: att, error: null }),
              }),
            }),
          }),
        };
      }
      if (table === "academic_no_class_days") {
        return {
          select: () => ({
            gte: () => ({
              lte: () => Promise.resolve({ data: [], error: null }),
            }),
          }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
  } as unknown as SupabaseClient;
}

const slots = [{ dayOfWeek: 0, startTime: "10:00", endTime: "11:00" }];

describe("loadTeacherSectionAttendanceMatrix — sectionStartsOn floor (mid-term onboarding)", () => {
  it("populates cells for class days BEFORE active enrollment.created_at when sectionStartsOn is given", async () => {
    const supabase = mockSupabase({
      enrollments: [
        {
          id: "e1",
          student_id: "s1",
          status: "active",
          // Enrollment row created mid-term, well after the section started.
          created_at: "2026-04-01T00:00:00.000Z",
          updated_at: "2026-04-01T00:00:00.000Z",
          profiles: { first_name: "A", last_name: "B" },
        },
      ],
    });

    const model = await loadTeacherSectionAttendanceMatrix(supabase, "sec-1", {
      effMin: "2026-03-01",
      effMax: "2026-04-12",
      scheduleSlots: slots,
      weekdayTimeZone: "UTC",
      sectionStartsOn: "2026-03-01",
    });

    expect(model.classDays[0]).toBe("2026-03-01");
    expect(model.cells["e1"]?.["2026-03-01"]).toBeNull();
    expect(model.cells["e1"]?.["2026-04-05"]).toBeNull();
  });

  it("does NOT populate pre-created_at cells when sectionStartsOn is omitted (legacy behavior)", async () => {
    const supabase = mockSupabase({
      enrollments: [
        {
          id: "e1",
          student_id: "s1",
          status: "active",
          created_at: "2026-04-01T00:00:00.000Z",
          updated_at: "2026-04-01T00:00:00.000Z",
          profiles: { first_name: "A", last_name: "B" },
        },
      ],
    });

    const model = await loadTeacherSectionAttendanceMatrix(supabase, "sec-1", {
      effMin: "2026-03-01",
      effMax: "2026-04-12",
      scheduleSlots: slots,
      weekdayTimeZone: "UTC",
    });

    expect(model.cells["e1"]?.["2026-03-01"]).toBeUndefined();
    expect(model.cells["e1"]?.["2026-04-05"]).toBeNull();
  });

  it("does NOT widen the floor for transferred enrollments (transfer date is the real start in this section)", async () => {
    const supabase = mockSupabase({
      enrollments: [
        {
          id: "e1",
          student_id: "s1",
          status: "transferred",
          created_at: "2026-04-01T00:00:00.000Z",
          updated_at: "2026-04-12T00:00:00.000Z",
          profiles: { first_name: "A", last_name: "B" },
        },
      ],
    });

    const model = await loadTeacherSectionAttendanceMatrix(supabase, "sec-1", {
      effMin: "2026-03-01",
      effMax: "2026-04-12",
      scheduleSlots: slots,
      weekdayTimeZone: "UTC",
      sectionStartsOn: "2026-03-01",
    });

    expect(model.cells["e1"]?.["2026-03-01"]).toBeUndefined();
    expect(model.cells["e1"]?.["2026-04-05"]).toBeNull();
  });
});
