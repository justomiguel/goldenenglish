import { describe, expect, it, vi } from "vitest";
import { loadAdminCohortCollectionsBulk } from "@/lib/billing/loadAdminCohortCollectionsBulk";
import type { CohortCollectionsBulkRaw } from "@/types/cohortCollectionsMatrix";
import type { SectionCollectionsView } from "@/types/sectionCollections";

const { mockLoadAdminSectionCollectionsView } = vi.hoisted(() => ({
  mockLoadAdminSectionCollectionsView: vi.fn(),
}));

vi.mock("@/lib/billing/loadAdminSectionCollectionsView", () => ({
  loadAdminSectionCollectionsView: mockLoadAdminSectionCollectionsView,
}));

// REGRESSION CHECK: the loader must invoke `admin_cohort_collections_bulk`
// with the cohort id + year, but still render the cohort matrix through the
// bounded section loaders if the RPC contract fails in an environment.

function buildFallbackSupabaseMock(response: {
  data: unknown;
  error: { message: string } | null;
}) {
  const rpc = vi.fn().mockResolvedValue(response);
  return {
    rpc,
    from: vi.fn((table: string) => {
      if (table === "academic_cohorts") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: "cohort-1", name: "2026" },
            error: null,
          }),
        };
      }
      if (table === "academic_sections") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          is: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({
            data: [{ id: "section-1", name: "Section A", archived_at: null }],
            error: null,
          }),
        };
      }
      throw new Error(`Unexpected table ${table}`);
    }),
  } as never;
}

function makeSectionView(): SectionCollectionsView {
  return {
    sectionId: "section-1",
    sectionName: "Section A",
    cohortId: "cohort-1",
    cohortName: "2026",
    year: 2026,
    todayMonth: 6,
    students: [],
    kpis: {
      paid: 100,
      pendingReview: 0,
      overdue: 50,
      upcoming: 0,
      expectedYear: 150,
      collectionRatio: 0.667,
      totalStudents: 1,
      overdueStudents: 1,
      health: "critical",
    },
  };
}

describe("loadAdminCohortCollectionsBulk", () => {
  it("falls back to bounded section loaders when the RPC errors out", async () => {
    mockLoadAdminSectionCollectionsView.mockResolvedValueOnce(makeSectionView());
    const supabase = buildFallbackSupabaseMock({
      data: null,
      error: { message: "boom" },
    });
    const res = await loadAdminCohortCollectionsBulk(supabase, "cohort-1", {
      todayYear: 2026,
      todayMonth: 6,
    });
    expect(res).not.toBeNull();
    expect(res!.sections).toHaveLength(1);
    expect(res!.totals.totalStudents).toBe(1);
  });

  it("returns null when the RPC returns no data", async () => {
    const supabase = {
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      })),
    } as never;
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
