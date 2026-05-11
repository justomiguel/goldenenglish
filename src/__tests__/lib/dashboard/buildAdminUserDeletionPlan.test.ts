import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildAdminUserDeletionPlan } from "@/lib/dashboard/buildAdminUserDeletionPlan";
import * as chunkedInMod from "@/lib/supabase/chunkedIn";

describe("buildAdminUserDeletionPlan", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns error when ids list becomes empty after dedupe filter", async () => {
    const admin = {} as never;
    const r = await buildAdminUserDeletionPlan(admin, []);
    expect(r).toEqual({ error: "empty" });
  });

  it("orders linked students before parent tutors and counts added students beyond the requested set", async () => {
    const parentId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const studentId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

    vi.spyOn(chunkedInMod, "chunkedIn").mockImplementation(
      async <T extends Record<string, unknown>>(
        _client: unknown,
        table: string,
        _column: string,
        ids: string[],
      ): Promise<T[]> => {
        if (table === "profiles") {
          const idsSet = new Set(ids);
          if (ids.length === 1 && idsSet.has(parentId)) {
            return [{ id: parentId, role: "parent" }] as unknown as T[];
          }
          if (idsSet.has(parentId) && idsSet.has(studentId)) {
            return [
              { id: parentId, role: "parent" },
              { id: studentId, role: "student" },
            ] as unknown as T[];
          }
        }
        if (table === "tutor_student_rel") {
          return [{ student_id: studentId }] as unknown as T[];
        }
        return [];
      },
    );

    const plan = await buildAdminUserDeletionPlan({} as never, [parentId]);
    expect("error" in plan).toBe(false);
    if ("error" in plan) throw new Error("unexpected");
    expect(plan.parentTutorTriggers).toEqual([parentId]);
    expect(plan.cascadeStudentIds).toEqual([studentId]);
    expect(plan.addedStudentCount).toBe(1);
    expect(plan.orderedIds[0]).toBe(studentId);
    expect(plan.orderedIds[1]).toBe(parentId);
  });
});
