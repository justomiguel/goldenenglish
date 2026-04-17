/** @vitest-environment node */
import { describe, expect, it, vi } from "vitest";
import { previewStudentAssistantScheduleConflicts } from "@/lib/academics/previewStudentAssistantScheduleConflicts";

describe("previewStudentAssistantScheduleConflicts", () => {
  it("skips overlap check when profile is not a student", async () => {
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: { role: "teacher" }, error: null }),
          }),
        }),
      })),
    };
    const r = await previewStudentAssistantScheduleConflicts(supabase as never, {
      sectionId: "sec-1",
      studentProfileId: "p-1",
    });
    expect(r).toEqual({ ok: true });
  });

  it("returns SCHEDULE_OVERLAP when another active section overlaps", async () => {
    const otherSectionId = "00000000-0000-4000-8000-0000000000aa";
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: { role: "student" }, error: null }),
              }),
            }),
          };
        }
        if (table === "section_enrollments") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [{ section_id: otherSectionId }],
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "academic_sections") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    id: "sec-target",
                    archived_at: null,
                    schedule_slots: [{ dayOfWeek: 1, startTime: "10:00", endTime: "11:00" }],
                  },
                  error: null,
                }),
              }),
              in: vi.fn().mockReturnValue({
                is: vi.fn().mockResolvedValue({
                  data: [
                    {
                      schedule_slots: [{ dayOfWeek: 1, startTime: "10:30", endTime: "11:30" }],
                    },
                  ],
                  error: null,
                }),
              }),
            }),
          };
        }
        throw new Error(`unexpected table ${table}`);
      }),
    };

    const r = await previewStudentAssistantScheduleConflicts(supabase as never, {
      sectionId: "sec-target",
      studentProfileId: "stu-1",
    });
    expect(r).toEqual({ ok: false, code: "SCHEDULE_OVERLAP" });
  });
});
