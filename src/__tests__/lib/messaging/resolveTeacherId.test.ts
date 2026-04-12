/** @vitest-environment node */
import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveTeacherIdForStudent } from "@/lib/messaging/resolveTeacherId";

function clientWithMaybeSingles(
  rows: Array<{ data: Record<string, unknown> | null; error: null }>,
): SupabaseClient {
  let i = 0;
  const maybeSingle = vi.fn(async () => {
    const r = rows[i];
    i += 1;
    return r ?? { data: null, error: null };
  });
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle,
  };
  return {
    from: vi.fn(() => chain),
  } as unknown as SupabaseClient;
}

describe("resolveTeacherIdForStudent", () => {
  it("returns assigned teacher id when profile and teacher row exist", async () => {
    const supabase = clientWithMaybeSingles([
      { data: { assigned_teacher_id: "t1" }, error: null },
      { data: { id: "t1" }, error: null },
    ]);
    await expect(resolveTeacherIdForStudent(supabase, "s1")).resolves.toBe("t1");
  });

  it("falls back to first teacher when assigned id is invalid", async () => {
    const supabase = clientWithMaybeSingles([
      { data: { assigned_teacher_id: "bad" }, error: null },
      { data: null, error: null },
      { data: { id: "fallback" }, error: null },
    ]);
    await expect(resolveTeacherIdForStudent(supabase, "s1")).resolves.toBe("fallback");
  });

  it("returns first teacher when no assignment", async () => {
    const supabase = clientWithMaybeSingles([
      { data: { assigned_teacher_id: null }, error: null },
      { data: { id: "only" }, error: null },
    ]);
    await expect(resolveTeacherIdForStudent(supabase, "s1")).resolves.toBe("only");
  });

  it("returns null when no teacher exists", async () => {
    const supabase = clientWithMaybeSingles([
      { data: { assigned_teacher_id: null }, error: null },
      { data: null, error: null },
    ]);
    await expect(resolveTeacherIdForStudent(supabase, "s1")).resolves.toBeNull();
  });
});
