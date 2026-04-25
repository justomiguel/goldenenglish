import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StudentMonthlyPaymentsStrip } from "@/components/student/StudentMonthlyPaymentsStrip";
import { dictEn } from "@/test/dictEn";
import type { StudentMonthlyPaymentsView } from "@/types/studentMonthlyPayments";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const submitAction = vi.fn().mockResolvedValue({ ok: true });
const submitEnrollmentFeeReceiptAction = vi.fn().mockResolvedValue({ ok: true });

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
      enrollmentFeeExempt: false,
      enrollmentFeeExemptReason: null,
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
          originalExpectedAmount: inPeriod ? 100 : null,
          scholarshipDiscountPercent: null,
          fullMonthExpectedAmount: inPeriod ? 100 : null,
          fullMonthOriginalExpectedAmount: inPeriod ? 100 : null,
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

function renderStrip(
  view: StudentMonthlyPaymentsView,
  receiptExpectedUsesFullMonth = false,
) {
  return render(
    <StudentMonthlyPaymentsStrip
      locale="en"
      studentId="stu-1"
      view={view}
      labels={monthlyLabels}
      paymentLabels={dictEn.dashboard.student}
      submitAction={submitAction}
      submitEnrollmentFeeReceiptAction={submitEnrollmentFeeReceiptAction}
      receiptExpectedUsesFullMonth={receiptExpectedUsesFullMonth}
    />,
  );
}

type CellPatch = Partial<StudentMonthlyPaymentsView["rows"][number]["cells"][number]>;

function viewWithCell(month: number, patch: CellPatch): StudentMonthlyPaymentsView {
  return {
    ...baseView,
    rows: [{
      ...baseView.rows[0]!,
      cells: baseView.rows[0]!.cells.map((c) => (c.month === month ? { ...c, ...patch } : c)),
    }],
  };
}

describe("StudentMonthlyPaymentsStrip", () => {
  it("renders one section row with 12 month cells", () => {
    renderStrip(baseView);
    expect(screen.getByRole("heading", { level: 2, name: "B1 Tuesdays" })).toBeInTheDocument();
    expect(screen.getByText("Cohort 2026")).toBeInTheDocument();
    const grid = screen.getByRole("grid", { name: /B1 Tuesdays/ });
    expect(grid.querySelectorAll("button")).toHaveLength(12);
  });

  it("disables out-of-period months and exposes their status via aria-label", () => {
    renderStrip(baseView);
    const januaryButton = screen
      .getAllByRole("button")
      .find((btn) => btn.getAttribute("aria-label")?.includes(monthlyLabels.statusOutOfPeriod));
    expect(januaryButton).toBeDefined();
    expect(januaryButton).toBeDisabled();
  });

  it("lets students inspect discounted amounts for past out-of-period scholarship months", () => {
    const scholarshipPastView = viewWithCell(1, {
      expectedAmount: 50,
      originalExpectedAmount: 100,
      scholarshipDiscountPercent: 50,
      fullMonthExpectedAmount: 50,
      fullMonthOriginalExpectedAmount: 100,
      currency: "USD",
    });
    renderStrip(scholarshipPastView);

    const januaryButton = screen.getByRole("button", {
      name: /Jan: Outside this section’s payment window · 50%/,
    });
    expect(januaryButton).not.toBeDisabled();
    fireEvent.click(januaryButton);
    expect(screen.getByText("$100").closest("del")).toBeInTheDocument();
    expect(screen.getByText("$50")).toBeInTheDocument();
    expect(screen.getByText(monthlyLabels.lockedOutOfPeriod)).toBeInTheDocument();
  });

  it("focuses the current month by default and shows the focus card", () => {
    renderStrip(baseView);
    expect(screen.getByText(monthlyLabels.expectedAmount)).toBeInTheDocument();
    expect(screen.getByText("$100")).toBeInTheDocument();
  });

  it("changes focus when a different month is clicked", () => {
    renderStrip(baseView);
    const aprilButton = screen
      .getAllByRole("button")
      .find((btn) => btn.getAttribute("aria-label")?.startsWith("Apr"));
    expect(aprilButton).toBeDefined();
    fireEvent.click(aprilButton!);
    expect(aprilButton).toHaveAttribute("aria-pressed", "true");
  });

  it("shows scholarship percentage inside discounted month cells", () => {
    const discountedView = viewWithCell(5, {
      expectedAmount: 50,
      originalExpectedAmount: 100,
      scholarshipDiscountPercent: 50,
    });

    renderStrip(discountedView);

    expect(screen.getByRole("button", { name: /May: Pending payment · 50%/ })).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByText("$100").closest("del")).toBeInTheDocument();
    expect(screen.getAllByText("$50").length).toBeGreaterThan(0);
  });

  it("shows full-month expected in the focus card when receiptExpectedUsesFullMonth is set", () => {
    const viewProrated = viewWithCell(5, {
      expectedAmount: 37.5,
      originalExpectedAmount: 37.5,
      fullMonthExpectedAmount: 100,
      fullMonthOriginalExpectedAmount: 100,
      proration: { numerator: 3, denominator: 8 },
    });
    renderStrip(viewProrated, true);
    expect(screen.getAllByText("$100")).toHaveLength(2);
    expect(screen.queryByText("$37.5")).not.toBeInTheDocument();
  });

  it("uses the full-month original amount when showing a parent-facing discount", () => {
    const viewDiscountedProrated = viewWithCell(5, {
      expectedAmount: 37.5,
      originalExpectedAmount: 75,
      fullMonthExpectedAmount: 50,
      fullMonthOriginalExpectedAmount: 100,
      scholarshipDiscountPercent: 50,
      proration: { numerator: 3, denominator: 4 },
    });

    renderStrip(viewDiscountedProrated, true);

    expect(screen.getByText("$100").closest("del")).toBeInTheDocument();
    expect(screen.getAllByText("$50").length).toBeGreaterThan(0);
    expect(screen.queryByText("$75")).not.toBeInTheDocument();
    expect(screen.queryByText("$37.5")).not.toBeInTheDocument();
  });

  it("shows the empty-state message when the student has no active sections", () => {
    renderStrip({ todayMonth: 5, todayYear: 2026, rows: [] });
    expect(screen.getByText(monthlyLabels.emptySections)).toBeInTheDocument();
  });

  it("explains when the student does not need to upload an enrollment fee receipt", () => {
    const viewExempt: StudentMonthlyPaymentsView = {
      ...baseView,
      rows: [
        {
          ...baseView.rows[0]!,
          enrollmentFeeAmount: 0,
          enrollmentFeeExempt: true,
          enrollmentFeeExemptReason: "Sibling scholarship",
        },
      ],
    };

    renderStrip(viewExempt);

    expect(screen.getByText(monthlyLabels.enrollmentFeeExemptTitle)).toBeInTheDocument();
    expect(screen.getByText(monthlyLabels.enrollmentFeeExemptBody)).toBeInTheDocument();
    expect(screen.getByText("Reason: Sibling scholarship")).toBeInTheDocument();
    expect(screen.queryByText(monthlyLabels.enrollmentFeeUploadBtn)).not.toBeInTheDocument();
  });
});
