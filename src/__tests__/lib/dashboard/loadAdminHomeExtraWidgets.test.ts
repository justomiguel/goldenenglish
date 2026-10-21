/** @vitest-environment node */
// REGRESSION CHECK: The cohort collections overview is heavy. The home
// must not call it when that card is hidden.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { factoryAdminHomeLayout, setAdminHomeItemHidden } from "@/lib/dashboard/adminHomeLayout";
import { loadAdminHomeExtraWidgets } from "@/lib/dashboard/loadAdminHomeExtraWidgets";

const { loadCurrentCohort, loadAdminCohortCollectionsOverview, loadAdminPeoplePageStats } =
  vi.hoisted(() => ({
    loadCurrentCohort: vi.fn(),
    loadAdminCohortCollectionsOverview: vi.fn(),
    loadAdminPeoplePageStats: vi.fn(),
  }));

vi.mock("@/lib/academics/currentCohort", () => ({
  loadCurrentCohort: (...args: unknown[]) => loadCurrentCohort(...args),
}));
vi.mock("@/lib/billing/loadAdminCohortCollectionsOverview", () => ({
  loadAdminCohortCollectionsOverview: (...args: unknown[]) =>
    loadAdminCohortCollectionsOverview(...args),
}));
vi.mock("@/lib/dashboard/loadAdminPeoplePageStats", () => ({
  loadAdminPeoplePageStats: (...args: unknown[]) => loadAdminPeoplePageStats(...args),
}));
vi.mock("server-only", () => ({}));

function supabaseStub() {
  const limit = vi.fn().mockResolvedValue({
    data: [{ id: "e1", slug: "open-day", title: "Open day", event_date: "2026-11-01", capacity: 40 }],
    error: null,
  });
  const order = vi.fn().mockReturnValue({ limit });
  const gte = vi.fn().mockReturnValue({ order });
  const is = vi.fn().mockReturnValue({ gte });
  const eq = vi.fn().mockReturnValue({ is });
  const select = vi.fn().mockReturnValue({ eq, in: vi.fn().mockResolvedValue({ count: 2, error: null }) });
  return { from: vi.fn().mockReturnValue({ select }), limit };
}

describe("loadAdminHomeExtraWidgets", () => {
  beforeEach(() => {
    loadCurrentCohort.mockReset();
    loadAdminCohortCollectionsOverview.mockReset();
    loadAdminPeoplePageStats.mockReset();
    loadAdminPeoplePageStats.mockResolvedValue({ newLast30Days: 4, neverEntered: 9 });
    loadCurrentCohort.mockResolvedValue({ id: "cohort-1", name: "2026" });
    loadAdminCohortCollectionsOverview.mockResolvedValue({
      cohortName: "2026",
      totals: { paid: 10, pendingReview: 2, overdue: 1 },
    });
  });

  it("skips the collections overview when the card is hidden", async () => {
    const layout = setAdminHomeItemHidden(
      factoryAdminHomeLayout({ shopEnabled: false }),
      "collections",
      true,
    );
    const result = await loadAdminHomeExtraWidgets({
      supabase: supabaseStub() as never,
      admin: {} as never,
      layout,
      shopEnabled: false,
      locale: "en",
      now: new Date("2026-10-20T12:00:00.000Z"),
    });
    expect(loadCurrentCohort).not.toHaveBeenCalled();
    expect(loadAdminCohortCollectionsOverview).not.toHaveBeenCalled();
    expect(result.collections).toBeNull();
    expect(result.peoplePulse).toEqual({ newLast30Days: 4, neverEntered: 9 });
  });

  it("loads collections only after a current cohort exists", async () => {
    loadCurrentCohort.mockResolvedValue(null);
    const result = await loadAdminHomeExtraWidgets({
      supabase: supabaseStub() as never,
      admin: {} as never,
      layout: factoryAdminHomeLayout({ shopEnabled: true }),
      shopEnabled: true,
      locale: "es",
      now: new Date("2026-10-20T12:00:00.000Z"),
    });
    expect(loadAdminCohortCollectionsOverview).not.toHaveBeenCalled();
    expect(result.collections).toBeNull();
    expect(result.upcomingEvents).toHaveLength(1);
    expect(result.shopOpenCount).toBe(2);
    expect(result.changelog.length).toBeLessThanOrEqual(3);
  });
});
