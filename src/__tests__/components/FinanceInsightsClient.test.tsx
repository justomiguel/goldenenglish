import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { dictEn } from "@/test/dictEn";
import type { FinanceMonthlyTrendPoint, FinanceProjection, FinanceReceiptProcessingStats, FinanceSectionRanked } from "@/types/financeAnalytics";

vi.mock("recharts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("recharts")>();
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
  };
});

vi.mock("@/components/molecules/RechartsSizedFrame", () => ({
  RechartsSizedFrame: ({ children }: { children: (w: number, h: number) => React.ReactNode }) => (
    <div data-testid="recharts-frame">{children(400, 300)}</div>
  ),
}));

import { FinanceInsightsClient } from "@/components/dashboard/admin/finance/FinanceInsightsClient";

const emptyTrend: FinanceMonthlyTrendPoint[] = Array.from({ length: 12 }, (_, i) => ({
  month: i + 1,
  expected: 0,
  collected: 0,
  pending: 0,
  overdue: 0,
  upcoming: 0,
  ratio: 0,
}));

const projection: FinanceProjection = {
  projectedYearEnd: 1000,
  expectedYearEnd: 1200,
  gap: -200,
  gapPercent: -0.167,
  monthsRemaining: 8,
  avgMonthlyCollection: 100,
};

const ranked: FinanceSectionRanked[] = [
  {
    sectionId: "sec-1",
    sectionName: "Section A",
    health: "critical",
    collectionRatio: 0.3,
    deltaFromAvg: -0.2,
    overdueStudents: 5,
    overdueAmount: 500,
    totalStudents: 10,
  },
];

const processingStats: FinanceReceiptProcessingStats = {
  avgDaysMonthly: 2.5,
  avgDaysInvoice: null,
  approvalRate: 0.85,
  rejectionRate: 0.15,
  totalResolved: 20,
  totalPending: 3,
  rejectionBreakdown: { image_blurry: 2, other: 1 },
  pendingAgeBuckets: [
    { label: "0-24h", count: 1 },
    { label: "24-72h", count: 1 },
    { label: "72h+", count: 1 },
  ],
};

const dict = dictEn.admin.finance.insights;

describe("FinanceInsightsClient", () => {
  it("renders the Trends sub-tab by default", () => {
    render(
      <FinanceInsightsClient
        trend={emptyTrend}
        projection={projection}
        ranked={ranked}
        processingStats={processingStats}
        cohortName="Test Cohort"
        locale="en"
        dict={dict}
      />,
    );
    expect(screen.getByText(dict.trend.title)).toBeInTheDocument();
  });

  it("switches to Operations sub-tab", () => {
    render(
      <FinanceInsightsClient
        trend={emptyTrend}
        projection={projection}
        ranked={ranked}
        processingStats={processingStats}
        cohortName="Test Cohort"
        locale="en"
        dict={dict}
      />,
    );
    fireEvent.click(screen.getByText(dict.tabs.operations));
    expect(screen.getByText(dict.processing.title)).toBeInTheDocument();
  });

  it("switches to Projections sub-tab", () => {
    render(
      <FinanceInsightsClient
        trend={emptyTrend}
        projection={projection}
        ranked={ranked}
        processingStats={processingStats}
        cohortName="Test Cohort"
        locale="en"
        dict={dict}
      />,
    );
    fireEvent.click(screen.getByText(dict.tabs.projections));
    expect(screen.getByText(dict.projection.title)).toBeInTheDocument();
  });

  it("displays cohort name in header", () => {
    render(
      <FinanceInsightsClient
        trend={emptyTrend}
        projection={projection}
        ranked={ranked}
        processingStats={processingStats}
        cohortName="Alpha Cohort"
        locale="en"
        dict={dict}
      />,
    );
    expect(screen.getByText(/Alpha Cohort/)).toBeInTheDocument();
  });
});
