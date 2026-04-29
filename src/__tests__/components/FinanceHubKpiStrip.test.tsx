import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { dictEn } from "@/test/dictEn";
import { FinanceHubKpiStrip } from "@/components/dashboard/admin/finance/FinanceHubKpiStrip";
import type { SectionCollectionsKpis } from "@/types/sectionCollections";

const kpisDict = dictEn.admin.finance.collections.kpis;

const mockKpis: SectionCollectionsKpis = {
  paid: 5000,
  pendingReview: 300,
  overdue: 1200,
  upcoming: 800,
  expectedYear: 12000,
  collectionRatio: 0.4167,
  totalStudents: 25,
  overdueStudents: 5,
  health: "watch",
};

describe("FinanceHubKpiStrip", () => {
  it("renders all 7 KPI tiles with formatted values", () => {
    render(
      <FinanceHubKpiStrip
        kpis={mockKpis}
        dict={kpisDict}
        locale="en"
        currency="USD"
      />,
    );

    expect(screen.getByText(kpisDict.expectedYear)).toBeInTheDocument();
    expect(screen.getByText(kpisDict.paid)).toBeInTheDocument();
    expect(screen.getByText(kpisDict.pendingReview)).toBeInTheDocument();
    expect(screen.getByText(kpisDict.overdue)).toBeInTheDocument();
    expect(screen.getByText(kpisDict.upcoming)).toBeInTheDocument();
    expect(screen.getByText(kpisDict.collectionRatio)).toBeInTheDocument();
    expect(screen.getByText(kpisDict.students)).toBeInTheDocument();

    expect(screen.getByText("$12,000")).toBeInTheDocument();
    expect(screen.getByText("$5,000")).toBeInTheDocument();
    expect(screen.getByText("$300")).toBeInTheDocument();
    expect(screen.getByText("$1,200")).toBeInTheDocument();
    expect(screen.getByText("$800")).toBeInTheDocument();
    expect(screen.getByText("25")).toBeInTheDocument();
  });

  it("shows overdueStudents count as a hint under the students tile", () => {
    render(
      <FinanceHubKpiStrip
        kpis={mockKpis}
        dict={kpisDict}
        locale="en"
        currency="USD"
      />,
    );
    expect(
      screen.getByText(`${kpisDict.overdueStudents}: 5`),
    ).toBeInTheDocument();
  });

  it("handles zero KPIs without crashing", () => {
    const zeroKpis: SectionCollectionsKpis = {
      paid: 0,
      pendingReview: 0,
      overdue: 0,
      upcoming: 0,
      expectedYear: 0,
      collectionRatio: 0,
      totalStudents: 0,
      overdueStudents: 0,
      health: "healthy",
    };
    render(
      <FinanceHubKpiStrip
        kpis={zeroKpis}
        dict={kpisDict}
        locale="en"
      />,
    );
    expect(screen.getByText(kpisDict.expectedYear)).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
  });
});
