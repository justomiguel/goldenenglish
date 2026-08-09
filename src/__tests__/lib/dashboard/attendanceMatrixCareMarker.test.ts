import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadTeacherSectionAttendanceMatrix } from "@/lib/dashboard/loadTeacherSectionAttendanceMatrix";

type ProfileJoin = {
  first_name: string;
  last_name: string;
  has_care_notes?: boolean | null;
};

let lastSelect = "";

function mockSupabase(profiles: ProfileJoin | null): SupabaseClient {
  return {
    from: (table: string) => {
      if (table === "section_enrollments") {
        return {
          select: (columns: string) => {
            lastSelect = columns;
            return {
              eq: () => ({
                order: () =>
                  Promise.resolve({
                    data: [
                      {
                        id: "e1",
                        student_id: "s1",
                        status: "active",
                        created_at: "2026-03-01T00:00:00.000Z",
                        updated_at: "2026-03-01T00:00:00.000Z",
                        profiles,
                      },
                    ],
                    error: null,
                  }),
              }),
            };
          },
        };
      }
      if (table === "section_attendance") {
        return {
          select: () => ({
            in: () => ({ gte: () => ({ lte: () => Promise.resolve({ data: [], error: null }) }) }),
          }),
        };
      }
      if (table === "academic_no_class_days") {
        return {
          select: () => ({ gte: () => ({ lte: () => Promise.resolve({ data: [], error: null }) }) }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
  } as unknown as SupabaseClient;
}

async function loadRow(profiles: ProfileJoin | null) {
  const model = await loadTeacherSectionAttendanceMatrix(mockSupabase(profiles), "sec-1", {
    effMin: "2026-03-01",
    effMax: "2026-03-08",
    scheduleSlots: [{ dayOfWeek: 0, startTime: "10:00", endTime: "11:00" }],
    weekdayTimeZone: "UTC",
  });
  return model.rows[0];
}

describe("attendance matrix care marker", () => {
  it("asks for the flag and nothing else about care", async () => {
    await loadRow({ first_name: "A", last_name: "B", has_care_notes: true });

    expect(lastSelect).toContain("has_care_notes");
    // The note text is not readable by this role at all; asking for it would
    // make the whole query fail rather than just omit a column.
    expect(lastSelect).not.toContain("care_health_note");
    expect(lastSelect).not.toContain("care_diet_note");
    expect(lastSelect).not.toContain("care_support_note");
  });

  it("marks a student who has care notes", async () => {
    const row = await loadRow({ first_name: "A", last_name: "B", has_care_notes: true });
    expect(row?.hasCareNotes).toBe(true);
  });

  it("leaves everyone else unmarked", async () => {
    expect((await loadRow({ first_name: "A", last_name: "B", has_care_notes: false }))?.hasCareNotes).toBe(
      false,
    );
    expect((await loadRow({ first_name: "A", last_name: "B" }))?.hasCareNotes).toBe(false);
    expect((await loadRow(null))?.hasCareNotes).toBe(false);
  });
});
