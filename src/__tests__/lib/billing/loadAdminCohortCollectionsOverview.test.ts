import { describe, expect, it, vi } from "vitest";
import { loadAdminCohortCollectionsOverview } from "@/lib/billing/loadAdminCohortCollectionsOverview";
import * as sectionLoader from "@/lib/billing/loadAdminSectionCollectionsView";
import { buildSectionCollectionsView } from "@/lib/billing/buildSectionCollectionsView";

// REGRESSION CHECK: this overview composes per-section views; changes here
// affect the cohort dashboard semaphore and totals visible to admins.

interface TableResponse {
  data: unknown;
  error: null;
}

function buildSupabaseMock(responses: Record<string, TableResponse>) {
  return {
    from: vi.fn((table: string) => {
      const response = responses[table] ?? { data: [], error: null };
      const chain = {
        select: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        in: vi.fn(() => chain),
        is: vi.fn(() => chain),
        order: vi.fn(() => chain),
        limit: vi.fn(() => chain),
        maybeSingle: vi.fn().mockResolvedValue(response),
        single: vi.fn().mockResolvedValue(response),
        then: (resolve: (v: TableResponse) => void) => resolve(response),
      };
      return chain;
    }),
  } as never;
}

describe("loadAdminCohortCollectionsOverview", () => {
  it("returns null when cohort does not exist", async () => {
    const supa = buildSupabaseMock({
      academic_cohorts: { data: null, error: null },
    });
    const res = await loadAdminCohortCollectionsOverview(supa, "missing", {
      todayYear: 2026,
      todayMonth: 6,
    });
    expect(res).toBeNull();
  });

  it("returns empty totals when cohort has no sections", async () => {
    const supa = buildSupabaseMock({
      academic_cohorts: { data: { id: "c1", name: "2026" }, error: null },
      academic_sections: { data: [], error: null },
    });
    const res = await loadAdminCohortCollectionsOverview(supa, "c1", {
      todayYear: 2026,
      todayMonth: 6,
    });
    expect(res).not.toBeNull();
    expect(res?.sections).toEqual([]);
    expect(res?.totals.totalStudents).toBe(0);
    expect(res?.totals.health).toBe("watch");
  });

  it("aggregates per-section views into cohort totals", async () => {
    const supa = buildSupabaseMock({
      academic_cohorts: { data: { id: "c1", name: "2026" }, error: null },
      academic_sections: {
        data: [
          { id: "sec-a", name: "Section A", archived_at: null },
          { id: "sec-b", name: "Section B", archived_at: null },
        ],
        error: null,
      },
    });

    const fakeView = (sectionId: string, paid: number) =>
      buildSectionCollectionsView({
        sectionId,
        sectionName: sectionId,
        cohortId: "c1",
        cohortName: "2026",
        todayYear: 2026,
        todayMonth: 6,
        plans: [
          {
            id: `plan-${sectionId}`,
            sectionId,
            effectiveFromYear: 2026,
            effectiveFromMonth: 1,
            monthlyFee: 100,
            currency: "USD",
            archivedAt: null,
          },
        ],
        students: [
          {
            studentId: `${sectionId}-stu`,
            studentName: `${sectionId} student`,
            documentLabel: null,
            scholarships: [],
            enrolledAt: "2026-01-01",
            payments: paid > 0
              ? [
                  {
                    id: "p",
                    sectionId,
                    month: 1,
                    year: 2026,
                    amount: paid,
                    status: "approved" as const,
                    receiptSignedUrl: null,
                  },
                ]
              : [],
          },
        ],
        sectionStartsOn: "2026-01-01",
        sectionEndsOn: "2026-12-31",
        scheduleSlots: [{ dayOfWeek: 2, startTime: "18:00", endTime: "19:30" }],
        sectionEnrollmentFeeAmount: 0,
      });

    vi.spyOn(sectionLoader, "loadAdminSectionCollectionsView").mockImplementation(
      async (_supa, sectionId) => {
        if (sectionId === "sec-a") return fakeView("sec-a", 100);
        return fakeView("sec-b", 0);
      },
    );

    const res = await loadAdminCohortCollectionsOverview(supa, "c1", {
      todayYear: 2026,
      todayMonth: 6,
    });
    expect(res?.sections).toHaveLength(2);
    expect(res?.totals.paid).toBe(100);
    expect(res?.totals.totalStudents).toBe(2);
    expect(res?.totals.overdueStudents).toBe(2);
    expect(res?.totals.health).toBe("critical");
  });
});
