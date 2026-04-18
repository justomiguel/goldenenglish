import { describe, expect, it, vi } from "vitest";
import { loadAdminCohortCollectionsBulk } from "@/lib/billing/loadAdminCohortCollectionsBulk";
import type { CohortCollectionsBulkRaw } from "@/types/cohortCollectionsMatrix";

// REGRESSION CHECK: the loader must invoke `admin_cohort_collections_bulk`
// with the cohort id + year and return null on RPC errors. The composition is
// covered by buildCohortCollectionsMatrix.test.ts.

function buildSupabaseRpcMock(response: {
  data: unknown;
  error: { message: string } | null;
}) {
  return {
    rpc: vi.fn().mockResolvedValue(response),
  } as never;
}

describe("loadAdminCohortCollectionsBulk", () => {
  it("returns null when the RPC errors out", async () => {
    const supabase = buildSupabaseRpcMock({
      data: null,
      error: { message: "boom" },
    });
    const res = await loadAdminCohortCollectionsBulk(supabase, "cohort-1", {
      todayYear: 2026,
      todayMonth: 6,
    });
    expect(res).toBeNull();
  });

  it("returns null when the RPC returns no data", async () => {
    const supabase = buildSupabaseRpcMock({ data: null, error: null });
    const res = await loadAdminCohortCollectionsBulk(supabase, "cohort-1", {
      todayYear: 2026,
      todayMonth: 6,
    });
    expect(res).toBeNull();
  });

  it("calls the RPC with cohort id + year and composes the matrix", async () => {
    const raw: CohortCollectionsBulkRaw = {
      cohort: { id: "cohort-1", name: "2026" },
      year: 2026,
      sections: [],
      enrollments: [],
      profiles: [],
      payments: [],
      scholarships: [],
      plans: [],
    };
    const rpc = vi.fn().mockResolvedValue({ data: raw, error: null });
    const supabase = { rpc } as never;
    const res = await loadAdminCohortCollectionsBulk(supabase, "cohort-1", {
      todayYear: 2026,
      todayMonth: 6,
    });
    expect(rpc).toHaveBeenCalledWith("admin_cohort_collections_bulk", {
      p_cohort_id: "cohort-1",
      p_year: 2026,
    });
    expect(res).not.toBeNull();
    expect(res!.cohortId).toBe("cohort-1");
    expect(res!.sections).toHaveLength(0);
  });
});
