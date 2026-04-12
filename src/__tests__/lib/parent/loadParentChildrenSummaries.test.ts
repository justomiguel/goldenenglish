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
        if (table === "attendance") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [{ status: "present" }, { status: "absent" }],
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
  });
});
