import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveTutorStudentLink } from "@/lib/auth/resolveTutorStudentLink";

interface ChainState {
  table: "tutor_student_rel" | "profiles" | string;
  filters: Record<string, unknown>;
}

function buildSupabase(rows: {
  link?: {
    financial_access_revoked_at: string | null;
    financial_access_revoked_by?: string | null;
  } | null;
  studentProfile?: { is_minor: boolean } | null;
}): SupabaseClient {
  const calls: ChainState[] = [];
  function tableMock(table: string) {
    const state: ChainState = { table, filters: {} };
    calls.push(state);
    const chain = {
      select: () => chain,
      eq: (col: string, value: unknown) => {
        state.filters[col] = value;
        return chain;
      },
      maybeSingle: () => {
        if (table === "tutor_student_rel") {
          return Promise.resolve({
            data: rows.link
              ? {
                  tutor_id: state.filters.tutor_id,
                  student_id: state.filters.student_id,
                  financial_access_revoked_at: rows.link.financial_access_revoked_at,
                  financial_access_revoked_by:
                    rows.link.financial_access_revoked_by ?? null,
                }
              : null,
            error: null,
          });
        }
        return Promise.resolve({
          data: rows.studentProfile ?? null,
          error: null,
        });
      },
    };
    return chain;
  }
  return { from: tableMock } as unknown as SupabaseClient;
}

describe("resolveTutorStudentLink", () => {
  it("treats missing link as revoked (default-deny when no row exists)", async () => {
    const supabase = buildSupabase({ link: null });
    const result = await resolveTutorStudentLink(supabase, "tutor-1", "stu-1");
    expect(result.linked).toBe(false);
    expect(result.financialAccessActive).toBe(false);
  });

  it("returns active access when the link has no revocation timestamp", async () => {
    const supabase = buildSupabase({
      link: { financial_access_revoked_at: null },
      studentProfile: { is_minor: false },
    });
    const result = await resolveTutorStudentLink(supabase, "tutor-1", "stu-1");
    expect(result.linked).toBe(true);
    expect(result.financialAccessActive).toBe(true);
    expect(result.studentIsMinor).toBe(false);
  });

  it("flags the link as revoked when financial_access_revoked_at is set", async () => {
    const supabase = buildSupabase({
      link: {
        financial_access_revoked_at: "2026-04-01T10:00:00Z",
        financial_access_revoked_by: "stu-1",
      },
      studentProfile: { is_minor: false },
    });
    const result = await resolveTutorStudentLink(supabase, "tutor-1", "stu-1");
    expect(result.linked).toBe(true);
    expect(result.financialAccessActive).toBe(false);
    expect(result.financialAccessRevokedBy).toBe("stu-1");
  });

  it("rejects self-links to avoid impossible permissions", async () => {
    const supabase = buildSupabase({
      link: { financial_access_revoked_at: null },
    });
    const result = await resolveTutorStudentLink(supabase, "u-1", "u-1");
    expect(result.linked).toBe(false);
    expect(result.financialAccessActive).toBe(false);
  });
});
