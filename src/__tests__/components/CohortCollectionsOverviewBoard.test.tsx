import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CohortCollectionsOverviewBoard } from "@/components/dashboard/admin/finance/CohortCollectionsOverviewBoard";
import { dictEn } from "@/test/dictEn";
import type { CohortCollectionsOverview } from "@/types/sectionCollections";

const dict = dictEn.admin.finance.collections;

const baseOverview: CohortCollectionsOverview = {
  cohortId: "co-1",
  cohortName: "Cohort 2026",
  year: 2026,
  sections: [
    {
      sectionId: "sec-a",
      sectionName: "B1 Tuesdays",
      archivedAt: null,
      kpis: {
        paid: 1200,
        pendingReview: 0,
        overdue: 0,
        upcoming: 0,
        expectedYear: 1200,
        collectionRatio: 1,
        totalStudents: 12,
        overdueStudents: 0,
        health: "healthy",
      },
    },
    {
      sectionId: "sec-b",
      sectionName: "B2 Mondays",
      archivedAt: null,
      kpis: {
        paid: 200,
        pendingReview: 0,
        overdue: 800,
        upcoming: 0,
        expectedYear: 1000,
        collectionRatio: 0.2,
        totalStudents: 10,
        overdueStudents: 6,
        health: "critical",
      },
    },
  ],
  totals: {
    paid: 1400,
    pendingReview: 0,
    overdue: 800,
    upcoming: 0,
    expectedYear: 2200,
    collectionRatio: 0.636,
    totalStudents: 22,
    overdueStudents: 6,
    health: "critical",
  },
};

describe("CohortCollectionsOverviewBoard", () => {
  it("renders one card per section with a link to its matrix", () => {
    render(
      <CohortCollectionsOverviewBoard
        overview={baseOverview}
        dict={dict}
        locale="en"
        baseHref="/en/dashboard/admin/finance/collections"
      />,
    );
    expect(screen.getByText("B1 Tuesdays")).toBeInTheDocument();
    expect(screen.getByText("B2 Mondays")).toBeInTheDocument();
    const linkA = screen.getByRole("link", { name: /B1 Tuesdays/ });
    expect(linkA).toHaveAttribute(
      "href",
      "/en/dashboard/admin/finance/collections/sec-a",
    );
  });

  it("renders the empty state when there are no sections", () => {
    render(
      <CohortCollectionsOverviewBoard
        overview={{ ...baseOverview, sections: [] }}
        dict={dict}
        locale="en"
        baseHref="/en/dashboard/admin/finance/collections"
      />,
    );
    expect(screen.getByText(dict.overview.noSections)).toBeInTheDocument();
  });
});
