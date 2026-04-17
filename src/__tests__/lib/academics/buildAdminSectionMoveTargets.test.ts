import { describe, expect, it } from "vitest";

import { buildAdminSectionMoveTargets } from "@/lib/academics/buildAdminSectionMoveTargets";

describe("buildAdminSectionMoveTargets", () => {
  it("drops archived section or cohort and excludes current section id", () => {
    const out = buildAdminSectionMoveTargets(
      [
        {
          id: "a",
          name: "S1",
          archived_at: null,
          academic_cohorts: { name: "C1", archived_at: null },
        },
        {
          id: "b",
          name: "S2",
          archived_at: "2020-01-01",
          academic_cohorts: { name: "C1", archived_at: null },
        },
        {
          id: "c",
          name: "S3",
          archived_at: null,
          academic_cohorts: { name: "C2", archived_at: "2020-01-01" },
        },
        {
          id: "x",
          name: "Cur",
          archived_at: null,
          academic_cohorts: { name: "C1", archived_at: null },
        },
      ],
      "x",
    );
    expect(out).toEqual([{ id: "a", label: "C1 — S1" }]);
  });
});
