// REGRESSION CHECK: This component is the consolidated financial card on
// /dashboard/student/payments. Asserting heading, four buckets, total debt,
// next due and credit-balance hint protects the user-story acceptance criteria
// (see docs/adr/2026-04-student-payments-year-summary.md).

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StudentPaymentsYearSummary } from "@/components/student/StudentPaymentsYearSummary";
import { dictEn } from "@/test/dictEn";
import type { StudentPaymentsYearSummary as Summary } from "@/lib/billing/buildStudentPaymentsYearSummary";

const labels = dictEn.dashboard.student.monthly.summary;

function buildSummary(overrides: Partial<Summary> = {}): Summary {
  return {
    year: 2026,
    paid: 0,
    pendingReview: 0,
    overdue: 0,
    upcoming: 0,
    creditBalance: 0,
    totalDebt: 0,
    nextDue: null,
    ...overrides,
  };
}

describe("StudentPaymentsYearSummary", () => {
  it("renders the four buckets and the year in the heading", () => {
    render(
      <StudentPaymentsYearSummary
        locale="en"
        labels={labels}
        summary={buildSummary({
          paid: 200,
          pendingReview: 100,
          overdue: 300,
          upcoming: 400,
          totalDebt: 800,
        })}
      />,
    );
    expect(
      screen.getByRole("heading", { level: 2, name: /Year overview/ }),
    ).toBeInTheDocument();
    expect(screen.getByText(labels.paid)).toBeInTheDocument();
    expect(screen.getByText(labels.pendingReview)).toBeInTheDocument();
    expect(screen.getByText(labels.overdue)).toBeInTheDocument();
    expect(screen.getByText(labels.upcoming)).toBeInTheDocument();
    expect(screen.getByText("$200")).toBeInTheDocument();
    expect(screen.getByText("$300")).toBeInTheDocument();
    expect(screen.getByText("$400")).toBeInTheDocument();
    expect(screen.getByText("$800")).toBeInTheDocument();
  });

  it("shows the next due section, month, year and amount when provided", () => {
    render(
      <StudentPaymentsYearSummary
        locale="en"
        labels={labels}
        summary={buildSummary({
          overdue: 100,
          totalDebt: 100,
          nextDue: {
            sectionId: "sec-a",
            sectionName: "B1 Tuesdays",
            year: 2026,
            month: 4,
            amount: 100,
          },
        })}
      />,
    );
    expect(screen.getByText(labels.nextDueLabel)).toBeInTheDocument();
    expect(
      screen.getByText(/B1 Tuesdays · April 2026 · \$100/),
    ).toBeInTheDocument();
  });

  it("shows the up-to-date message when there is no next due date", () => {
    render(
      <StudentPaymentsYearSummary
        locale="en"
        labels={labels}
        summary={buildSummary({ paid: 1000 })}
      />,
    );
    expect(screen.getByText(labels.noNextDue)).toBeInTheDocument();
  });

  it("renders the credit-balance hint only when credit balance is positive", () => {
    const { rerender } = render(
      <StudentPaymentsYearSummary
        locale="en"
        labels={labels}
        summary={buildSummary({ creditBalance: 0, totalDebt: 100, upcoming: 100 })}
      />,
    );
    expect(screen.queryByText(labels.creditBalance, { exact: false })).toBeNull();

    rerender(
      <StudentPaymentsYearSummary
        locale="en"
        labels={labels}
        summary={buildSummary({ creditBalance: 50, totalDebt: 50, upcoming: 100 })}
      />,
    );
    expect(
      screen.getByText(new RegExp(`${labels.creditBalance}.*\\$50`)),
    ).toBeInTheDocument();
  });
});
