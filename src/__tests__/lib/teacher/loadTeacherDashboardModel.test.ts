import { describe, it, expect, vi } from "vitest";
import { loadTeacherDashboardModel } from "@/lib/teacher/loadTeacherDashboardModel";

// REGRESSION CHECK: Teacher dashboard aggregates section ids, messages, and grade view; changing chunking or filters affects counts.

describe("loadTeacherDashboardModel", () => {
  it("returns empty model when teacher has no sections", async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "academic_sections") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          };
        }
        if (table === "academic_section_assistants") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          };
        }
        throw new Error(`unexpected ${table}`);
      }),
    };
    const r = await loadTeacherDashboardModel(supabase as never, "u1");
    expect(r).toEqual({
      todayClasses: [],
      retentionOpenCount: 0,
      familyMessageAttentionCount: 0,
      sectionGrades: [],
    });
  });

  it("aggregates retention count, messages, and section averages", async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "academic_sections") {
          return {
            select: vi.fn((cols: string) => {
              if (cols === "id") {
                return {
                  eq: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue({ data: [{ id: "sec1" }], error: null }),
                  }),
                };
              }
              return {
                in: vi.fn().mockResolvedValue({
                  data: [
                    {
                      id: "sec1",
                      name: "N1",
                      schedule_slots: [],
                      academic_cohorts: { name: "C" },
                    },
                  ],
                  error: null,
                }),
              };
            }),
          };
        }
        if (table === "academic_section_assistants") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          };
        }
        if (table === "retention_alerts") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ count: 3, error: null }),
            }),
          };
        }
        if (table === "portal_messages") {
          return {
            select: vi.fn().mockReturnValue({
              or: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({
                    data: [{ sender_id: "s1", recipient_id: "u1" }],
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        if (table === "section_enrollments") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [{ id: "e1", section_id: "sec1" }],
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: [{ id: "s1", role: "student" }], error: null }),
            }),
          };
        }
        if (table === "v_section_enrollment_grade_average") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: [{ enrollment_id: "e1", avg_score: 8 }], error: null }),
            }),
          };
        }
        throw new Error(`unexpected ${table}`);
      }),
    };

    const r = await loadTeacherDashboardModel(supabase as never, "u1");
    expect(r.retentionOpenCount).toBe(3);
    expect(r.familyMessageAttentionCount).toBe(1);
    expect(r.sectionGrades).toHaveLength(1);
    expect(r.sectionGrades[0].sectionId).toBe("sec1");
    expect(r.sectionGrades[0].avgScore).toBe(8);
  });
});
