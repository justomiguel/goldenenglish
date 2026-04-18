import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { listTutorStudentsWithFinance } from "@/lib/auth/listTutorStudentsWithFinance";

interface RelRow {
  student_id: string;
  financial_access_revoked_at: string | null;
}
interface ProfileRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  is_minor: boolean | null;
}

function buildSupabase(opts: {
  links: RelRow[];
  profiles: ProfileRow[];
}): SupabaseClient {
  return {
    from: (table: string) => {
      if (table === "tutor_student_rel") {
        const chain = {
          select: () => chain,
          eq: () => chain,
          order: () => chain,
          limit: () =>
            Promise.resolve({ data: opts.links, error: null }),
        };
        return chain;
      }
      if (table === "profiles") {
        const chain = {
          select: () => chain,
          in: () =>
            Promise.resolve({ data: opts.profiles, error: null }),
        };
        return chain;
      }
      throw new Error(`unexpected table ${table}`);
    },
  } as unknown as SupabaseClient;
}

describe("listTutorStudentsWithFinance", () => {
  it("returns an empty list when the tutor has no linked students", async () => {
    const supabase = buildSupabase({ links: [], profiles: [] });
    const rows = await listTutorStudentsWithFinance(supabase, "tutor-1");
    expect(rows).toEqual([]);
  });

  it("flags revoked access via financial_access_revoked_at and joins student names", async () => {
    const supabase = buildSupabase({
      links: [
        { student_id: "stu-1", financial_access_revoked_at: null },
        {
          student_id: "stu-2",
          financial_access_revoked_at: "2026-04-01T10:00:00Z",
        },
      ],
      profiles: [
        { id: "stu-1", first_name: "Ana", last_name: "Lopez", is_minor: false },
        { id: "stu-2", first_name: "Bruno", last_name: "Diaz", is_minor: true },
      ],
    });
    const rows = await listTutorStudentsWithFinance(supabase, "tutor-1");
    expect(rows.map((r) => r.studentId)).toEqual(["stu-1", "stu-2"]);
    expect(rows[0].financialAccessActive).toBe(true);
    expect(rows[1].financialAccessActive).toBe(false);
    expect(rows[1].isMinor).toBe(true);
    expect(rows[0].displayName).toBe("Ana Lopez");
  });

  it("sorts students alphabetically by display name (case-insensitive)", async () => {
    const supabase = buildSupabase({
      links: [
        { student_id: "stu-1", financial_access_revoked_at: null },
        { student_id: "stu-2", financial_access_revoked_at: null },
      ],
      profiles: [
        { id: "stu-1", first_name: "Zoe", last_name: "X", is_minor: false },
        { id: "stu-2", first_name: "ada", last_name: "k", is_minor: false },
      ],
    });
    const rows = await listTutorStudentsWithFinance(supabase, "tutor-1");
    expect(rows.map((r) => r.studentId)).toEqual(["stu-2", "stu-1"]);
  });
});
