/** @vitest-environment node */
import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  loadLinkedStudentIdsForParent,
  loadTeacherIdByStudentId,
  loadParentLinkedTeacherIds,
  parentCanMessageTeacher,
} from "@/lib/messaging/loadParentLinkedTeacherIds";

function chain(resolved: { data: unknown; error: unknown }) {
  const self = {
    select: vi.fn(() => self),
    eq: vi.fn(() => self),
    in: vi.fn(() => self),
    is: vi.fn(() => self),
    order: vi.fn(() => self),
    maybeSingle: vi.fn().mockResolvedValue(resolved),
    single: vi.fn().mockResolvedValue(resolved),
    limit: vi.fn().mockResolvedValue(resolved),
    then(onFulfilled: (v: unknown) => unknown) {
      return Promise.resolve(resolved).then(onFulfilled);
    },
  };
  return self;
}

describe("loadParentLinkedTeacherIds", () => {
  it("loadLinkedStudentIdsForParent dedupes student ids", async () => {
    const supabase = {
      from: vi.fn(() =>
        chain({
          data: [{ student_id: "s1" }, { student_id: "s1" }, { student_id: "s2" }],
          error: null,
        }),
      ),
    } as unknown as SupabaseClient;

    await expect(loadLinkedStudentIdsForParent(supabase, "p1")).resolves.toEqual(["s1", "s2"]);
  });

  it("loadTeacherIdByStudentId prefers assigned_teacher_id over section teacher", async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return chain({
            data: [{ id: "s1", assigned_teacher_id: "t-assigned" }],
            error: null,
          });
        }
        throw new Error(`unexpected ${table}`);
      }),
    } as unknown as SupabaseClient;

    const map = await loadTeacherIdByStudentId(supabase, ["s1"]);
    expect(map.get("s1")).toBe("t-assigned");
  });

  it("loadTeacherIdByStudentId falls back to active section lead teacher", async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return chain({
            data: [{ id: "s1", assigned_teacher_id: null }],
            error: null,
          });
        }
        if (table === "section_enrollments") {
          return chain({
            data: [{ student_id: "s1", section_id: "sec1", created_at: "2026-01-01" }],
            error: null,
          });
        }
        if (table === "academic_sections") {
          return chain({
            data: [{ id: "sec1", teacher_id: "t-section" }],
            error: null,
          });
        }
        throw new Error(`unexpected ${table}`);
      }),
    } as unknown as SupabaseClient;

    const map = await loadTeacherIdByStudentId(supabase, ["s1"]);
    expect(map.get("s1")).toBe("t-section");
  });

  it("loadParentLinkedTeacherIds unions teachers across linked students", async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "tutor_student_rel") {
          return chain({
            data: [{ student_id: "s1" }, { student_id: "s2" }],
            error: null,
          });
        }
        if (table === "profiles") {
          return chain({
            data: [
              { id: "s1", assigned_teacher_id: "t1" },
              { id: "s2", assigned_teacher_id: "t2" },
            ],
            error: null,
          });
        }
        throw new Error(`unexpected ${table}`);
      }),
    } as unknown as SupabaseClient;

    await expect(loadParentLinkedTeacherIds(supabase, "p1")).resolves.toEqual(
      expect.arrayContaining(["t1", "t2"]),
    );
  });

  it("parentCanMessageTeacher is true when teacher is linked via section", async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "tutor_student_rel") {
          return chain({ data: [{ student_id: "s1" }], error: null });
        }
        if (table === "profiles") {
          return chain({ data: [{ id: "s1", assigned_teacher_id: null }], error: null });
        }
        if (table === "section_enrollments") {
          return chain({
            data: [{ student_id: "s1", section_id: "sec1", created_at: "2026-01-01" }],
            error: null,
          });
        }
        if (table === "academic_sections") {
          return chain({ data: [{ id: "sec1", teacher_id: "t-section" }], error: null });
        }
        throw new Error(`unexpected ${table}`);
      }),
    } as unknown as SupabaseClient;

    await expect(parentCanMessageTeacher(supabase, "p1", "t-section")).resolves.toBe(true);
    await expect(parentCanMessageTeacher(supabase, "p1", "t-other")).resolves.toBe(false);
  });
});
