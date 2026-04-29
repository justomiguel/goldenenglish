import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { dictEn } from "@/test/dictEn";
import type { FinanceMonthlyTrendPoint } from "@/types/financeAnalytics";

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

import { FinanceCollectionTrendChart } from "@/components/dashboard/admin/finance/FinanceCollectionTrendChart";

const trend: FinanceMonthlyTrendPoint[] = Array.from({ length: 12 }, (_, i) => ({
  month: i + 1,
  expected: 100,
  collected: 80,
  pending: 10,
  overdue: 10,
  upcoming: 0,
  ratio: 0.8,
}));

const labels = dictEn.admin.finance.insights.trend;

describe("FinanceCollectionTrendChart", () => {
  it("renders title and hint", () => {
    render(
      <FinanceCollectionTrendChart
        trend={trend}
        locale="en"
        labels={labels}
      />,
    );
    expect(screen.getByText(labels.title)).toBeInTheDocument();
    expect(screen.getByText(labels.hint)).toBeInTheDocument();
  });

  it("renders the chart frame", () => {
    render(
      <FinanceCollectionTrendChart
        trend={trend}
        locale="en"
        labels={labels}
      />,
    );
    expect(screen.getByTestId("recharts-frame")).toBeInTheDocument();
  });
});
