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
      chargesEnrollmentFee: true,
      currentPlan: {
        id: "plan-1",
        sectionId: "sec-1",
        effectiveFromYear: 2026,
        effectiveFromMonth: 1,
        monthlyFee: 100,
        paymentsCount: 10,
        chargesEnrollmentFee: true,
        periodStartYear: 2026,
        periodStartMonth: 3,
      },
      cells: Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        const inPeriod = month >= 3 && month <= 12;
        return {
          month,
          year: 2026,
          status: inPeriod ? (month === 5 ? "due" : "due") : "out-of-period",
          expectedAmount: inPeriod ? 100 : null,
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
