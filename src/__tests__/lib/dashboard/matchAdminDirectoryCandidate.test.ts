import { describe, expect, it } from "vitest";
import { filterAdminDirectoryCandidates } from "@/lib/dashboard/matchAdminDirectoryCandidate";
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

describe("filterAdminDirectoryCandidates", () => {
  it("applies access, enrollment, and section together", () => {
    const rows = [
      candidate({
        id: "a",
        lastSessionStartAt: null,
        sectionIds: ["s1"],
      }),
      candidate({
        id: "b",
        lastSessionStartAt: null,
        sectionIds: ["s2"],
      }),
      candidate({
        id: "c",
        lastSessionStartAt: "2026-08-01T00:00:00.000Z",
        sectionIds: ["s1"],
      }),
    ];

    const matched = filterAdminDirectoryCandidates(
      rows,
      { access: "never", section: "s1" },
      { now },
    );
    expect(matched.map((r) => r.id)).toEqual(["a"]);
  });

  it("treats section + enrollment=without as empty", () => {
    const rows = [candidate({ id: "a", sectionIds: ["s1"] })];
    expect(
      filterAdminDirectoryCandidates(rows, { section: "s1", enrollment: "without" }, { now }),
    ).toEqual([]);
  });

  it("matches teacher lead vs assistant of a section", () => {
    const rows = [
      candidate({ id: "lead", leadSectionIds: ["s1"], sectionIds: ["s1"] }),
      candidate({ id: "asst", assistantSectionIds: ["s1"], sectionIds: ["s1"] }),
    ];
    expect(
      filterAdminDirectoryCandidates(rows, { section: "s1", teachingRole: "lead" }, { now }).map(
        (r) => r.id,
      ),
    ).toEqual(["lead"]);
    expect(
      filterAdminDirectoryCandidates(rows, { teachingRole: "assistant" }, { now }).map((r) => r.id),
    ).toEqual(["asst"]);
  });

  it("omits one dimension when counting facets", () => {
    const rows = [
      candidate({ id: "a", lastSessionStartAt: null, sectionIds: ["s1"] }),
      candidate({ id: "b", lastSessionStartAt: "2026-08-01T00:00:00.000Z", sectionIds: ["s1"] }),
    ];
    const withAccess = filterAdminDirectoryCandidates(
      rows,
      { access: "never", section: "s1" },
      { now },
    );
    const omitAccess = filterAdminDirectoryCandidates(
      rows,
      { access: "never", section: "s1" },
      { now, omit: "access" },
    );
    expect(withAccess.map((r) => r.id)).toEqual(["a"]);
    expect(omitAccess.map((r) => r.id)).toEqual(["a", "b"]);
  });
});
