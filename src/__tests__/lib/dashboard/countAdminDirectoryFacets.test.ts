import { describe, expect, it } from "vitest";
import { countAdminDirectoryFacets } from "@/lib/dashboard/countAdminDirectoryFacets";
import type { AdminDirectoryCandidate } from "@/lib/dashboard/adminDirectoryFilters";

const now = new Date("2026-08-28T12:00:00.000Z");

function candidate(partial: Partial<AdminDirectoryCandidate> & { id: string }): AdminDirectoryCandidate {
  return {
    phone: "",
    createdAt: "2026-01-01T00:00:00.000Z",
    lastSessionStartAt: "2026-08-01T00:00:00.000Z",
    sectionIds: [],
    leadSectionIds: [],
    assistantSectionIds: [],
    hasParentLink: false,
    hasScholarship: false,
    hasDue: false,
    emailDeliverable: false,
    hasChildren: false,
    ...partial,
  };
}

describe("countAdminDirectoryFacets", () => {
  it("facets section counts by the other filters (access=never)", () => {
    const rows = [
      candidate({ id: "a", lastSessionStartAt: null, sectionIds: ["s1", "s2"] }),
      candidate({ id: "b", lastSessionStartAt: null, sectionIds: ["s1"] }),
      candidate({
        id: "c",
        lastSessionStartAt: "2026-08-01T00:00:00.000Z",
        sectionIds: ["s1"],
      }),
    ];
    const facets = countAdminDirectoryFacets(rows, { access: "never" }, ["s1", "s2"], now);
    expect(facets.section.s1).toBe(2);
    expect(facets.section.s2).toBe(1);
    expect(facets.sectionAll).toBe(2);
    expect(facets.access.all).toBe(3);
    expect(facets.access.never).toBe(2);
    expect(facets.access.entered).toBe(1);
  });
});
