import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StudentMonthlyPaymentsStrip } from "@/components/student/StudentMonthlyPaymentsStrip";
import { dictEn } from "@/test/dictEn";
import type { StudentMonthlyPaymentsView } from "@/types/studentMonthlyPayments";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const submitAction = vi.fn().mockResolvedValue({ ok: true });

const baseView: StudentMonthlyPaymentsView = {
  todayMonth: 5,
  todayYear: 2026,
  rows: [
    {
      sectionId: "sec-1",
      sectionName: "B1 Tuesdays",
      cohortName: "Cohort 2026",
      hasActivePlan: true,
      enrollmentFeeAmount: 150,
      enrollmentFeeCurrency: "USD",
      currentPlan: {
        id: "plan-1",
        sectionId: "sec-1",
        effectiveFromYear: 2026,
        effectiveFromMonth: 1,
        monthlyFee: 100,
        currency: "USD",
        archivedAt: null,
      },
      cells: Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        const inPeriod = month >= 3 && month <= 12;
        return {
          month,
          year: 2026,
          status: inPeriod ? "due" : "out-of-period",
          expectedAmount: inPeriod ? 100 : null,
          fullMonthExpectedAmount: inPeriod ? 100 : null,
          currency: inPeriod ? "USD" : null,
          proration: inPeriod ? { numerator: 4, denominator: 4 } : null,
          recordedAmount: null,
          paymentId: null,
          receiptSignedUrl: null,
          isCurrent: month === 5,
        };
      }),
    },
  ],
};

const monthlyLabels = dictEn.dashboard.student.monthly;

describe("StudentMonthlyPaymentsStrip", () => {
  it("renders one section row with 12 month cells", () => {
    render(
      <StudentMonthlyPaymentsStrip
        locale="en"
        studentId="stu-1"
        view={baseView}
        labels={monthlyLabels}
        paymentLabels={dictEn.dashboard.student}
        submitAction={submitAction}
      />,
    );
    expect(screen.getByRole("heading", { level: 2, name: "B1 Tuesdays" })).toBeInTheDocument();
    expect(screen.getByText("Cohort 2026")).toBeInTheDocument();
    const grid = screen.getByRole("grid", { name: /B1 Tuesdays/ });
    expect(grid.querySelectorAll("button")).toHaveLength(12);
  });

  it("disables out-of-period months and exposes their status via aria-label", () => {
    render(
      <StudentMonthlyPaymentsStrip
        locale="en"
        studentId="stu-1"
        view={baseView}
        labels={monthlyLabels}
        paymentLabels={dictEn.dashboard.student}
        submitAction={submitAction}
      />,
    );
    const januaryButton = screen
      .getAllByRole("button")
      .find((btn) => btn.getAttribute("aria-label")?.includes(monthlyLabels.statusOutOfPeriod));
    expect(januaryButton).toBeDefined();
    expect(januaryButton).toBeDisabled();
  });

  it("focuses the current month by default and shows the focus card", () => {
    render(
      <StudentMonthlyPaymentsStrip
        locale="en"
        studentId="stu-1"
        view={baseView}
        labels={monthlyLabels}
        paymentLabels={dictEn.dashboard.student}
        submitAction={submitAction}
      />,
    );
    expect(screen.getByText(monthlyLabels.expectedAmount)).toBeInTheDocument();
    expect(screen.getByText("$100")).toBeInTheDocument();
  });

  it("changes focus when a different month is clicked", () => {
    render(
      <StudentMonthlyPaymentsStrip
        locale="en"
        studentId="stu-1"
        view={baseView}
        labels={monthlyLabels}
        paymentLabels={dictEn.dashboard.student}
        submitAction={submitAction}
      />,
    );
    const aprilButton = screen
      .getAllByRole("button")
      .find((btn) => btn.getAttribute("aria-label")?.startsWith("Apr"));
    expect(aprilButton).toBeDefined();
    fireEvent.click(aprilButton!);
    expect(aprilButton).toHaveAttribute("aria-pressed", "true");
  });

  it("shows full-month expected in the focus card when receiptExpectedUsesFullMonth is set", () => {
    const viewProrated: StudentMonthlyPaymentsView = {
      todayMonth: 5,
      todayYear: 2026,
      rows: [
        {
          ...baseView.rows[0]!,
          cells: baseView.rows[0]!.cells.map((c) =>
            c.month === 5
              ? {
                  ...c,
                  expectedAmount: 37.5,
                  fullMonthExpectedAmount: 100,
                  proration: { numerator: 3, denominator: 8 },
                }
              : c,
          ),
        },
      ],
    };
    render(
      <StudentMonthlyPaymentsStrip
        locale="en"
        studentId="stu-1"
        view={viewProrated}
        labels={monthlyLabels}
        paymentLabels={dictEn.dashboard.student}
        submitAction={submitAction}
        receiptExpectedUsesFullMonth
      />,
    );
    expect(screen.getByText("$100")).toBeInTheDocument();
    expect(screen.queryByText("$37.5")).not.toBeInTheDocument();
  });

  it("shows the empty-state message when the student has no active sections", () => {
    render(
      <StudentMonthlyPaymentsStrip
        locale="en"
        studentId="stu-1"
        view={{ todayMonth: 5, todayYear: 2026, rows: [] }}
        labels={monthlyLabels}
        paymentLabels={dictEn.dashboard.student}
        submitAction={submitAction}
      />,
    );
    expect(screen.getByText(monthlyLabels.emptySections)).toBeInTheDocument();
  });
});
