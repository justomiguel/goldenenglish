import { describe, expect, it } from "vitest";
import {
  hubCohortHref,
  orderHubCohorts,
  resolveHubCohortId,
  type HubCohortOption,
} from "@/lib/academics/resolveHubCohortSelection";

const current: HubCohortOption = {
  id: "current",
  name: "2026",
  isCurrent: true,
  archivedAt: null,
};
const active: HubCohortOption = {
  id: "active",
  name: "2027",
  isCurrent: false,
  archivedAt: null,
};
const archived: HubCohortOption = {
  id: "old",
  name: "2024",
  isCurrent: false,
  archivedAt: "2025-01-01",
};

describe("resolveHubCohortSelection", () => {
  it("puts the current cohort first and archived cohorts last", () => {
    expect(orderHubCohorts([archived, active, current]).map((c) => c.id)).toEqual([
      "current",
      "active",
      "old",
    ]);
  });

  it("selects the current cohort unless the query names a real cohort", () => {
    const rows = [current, active, archived];
    expect(resolveHubCohortId(rows, null)).toBe("current");
    expect(resolveHubCohortId(rows, "old")).toBe("old");
    expect(resolveHubCohortId(rows, "missing")).toBe("current");
    expect(resolveHubCohortId([active], "")).toBeNull();
  });

  it("keeps the other query keys when the cohort changes", () => {
    expect(hubCohortHref("/es/dashboard/admin/academic", "tab=fees", "old")).toBe(
      "/es/dashboard/admin/academic?tab=fees&cohort=old",
    );
  });
});
