import { describe, expect, it } from "vitest";
import { rankSectionsByHealth } from "@/lib/billing/rankSectionsByHealth";
import type { CohortCollectionsMatrixSection } from "@/types/cohortCollectionsMatrix";
import type { SectionCollectionsKpis, SectionCollectionsHealth } from "@/types/sectionCollections";

function makeKpis(overrides: Partial<SectionCollectionsKpis> & { health: SectionCollectionsHealth }): SectionCollectionsKpis {
  return {
    paid: 100,
    pendingReview: 0,
    overdue: 0,
    upcoming: 0,
    expectedYear: 200,
    collectionRatio: 0.5,
    totalStudents: 10,
    overdueStudents: 0,
    ...overrides,
  };
}

function makeSection(
  name: string,
  kpis: SectionCollectionsKpis,
): CohortCollectionsMatrixSection {
  return {
    archivedAt: null,
    view: {
      sectionId: `sec-${name}`,
      sectionName: name,
      cohortId: "coh-1",
      cohortName: "Cohort 1",
      year: 2026,
      todayMonth: 4,
      sectionStartsOn: "2026-01-15",
      sectionEndsOn: "2026-12-15",
      students: [],
      kpis,
    },
  };
}

describe("rankSectionsByHealth", () => {
  it("sorts critical before watch before healthy", () => {
    const sections = [
      makeSection("Healthy", makeKpis({ health: "healthy", collectionRatio: 0.9 })),
      makeSection("Critical", makeKpis({ health: "critical", collectionRatio: 0.3 })),
      makeSection("Watch", makeKpis({ health: "watch", collectionRatio: 0.7 })),
    ];
    const ranked = rankSectionsByHealth(sections);
    expect(ranked[0]!.sectionName).toBe("Critical");
    expect(ranked[1]!.sectionName).toBe("Watch");
    expect(ranked[2]!.sectionName).toBe("Healthy");
  });

  it("sorts by ratio within same health tier", () => {
    const sections = [
      makeSection("WatchB", makeKpis({ health: "watch", collectionRatio: 0.75 })),
      makeSection("WatchA", makeKpis({ health: "watch", collectionRatio: 0.65 })),
    ];
    const ranked = rankSectionsByHealth(sections);
    expect(ranked[0]!.sectionName).toBe("WatchA");
    expect(ranked[1]!.sectionName).toBe("WatchB");
  });

  it("computes delta from cohort average", () => {
    const sections = [
      makeSection("A", makeKpis({ health: "healthy", collectionRatio: 0.8, expectedYear: 100, paid: 80 })),
      makeSection("B", makeKpis({ health: "watch", collectionRatio: 0.4, expectedYear: 100, paid: 40 })),
    ];
    const ranked = rankSectionsByHealth(sections);
    const avgRatio = (80 + 40) / (100 + 100);
    const deltaA = 0.8 - avgRatio;
    expect(ranked.find((r) => r.sectionName === "A")!.deltaFromAvg).toBeCloseTo(deltaA, 2);
  });

  it("returns empty array for no sections", () => {
    expect(rankSectionsByHealth([])).toEqual([]);
  });
});
