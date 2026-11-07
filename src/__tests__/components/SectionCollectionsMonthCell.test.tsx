import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SectionCollectionsMonthCell } from "@/components/dashboard/admin/finance/SectionCollectionsMonthCell";

const labels = {
  statusApproved: "Approved",
  statusPending: "Pending",
  statusRejected: "Rejected",
  statusExempt: "Exempt",
  statusDue: "Due",
  statusOutOfPeriod: "Out of period",
  statusNoPlan: "No plan",
  expectedAmount: "Expected",
};

describe("SectionCollectionsMonthCell", () => {
  it("shows the scholarship percentage inside discounted month cells", () => {
    render(
      <SectionCollectionsMonthCell
        cell={{
          month: 5,
          year: 2026,
          status: "due",
          expectedAmount: 50,
          fullMonthExpectedAmount: 100,
          currency: "USD",
          proration: null,
          recordedAmount: null,
          paymentId: null,
          receiptSignedUrl: null,
          isCurrent: false,
        }}
        monthLabel="May"
        todayMonth={6}
        year={2026}
        scholarshipDiscountPercent={50}
        ariaPrefix="Ana Student"
        locale="en"
        labels={labels}
      />,
    );

    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByLabelText(/Ana Student · May · Due · 50%/)).toBeInTheDocument();
    expect(screen.getByRole("button").className).not.toContain("--color-success");
    expect(screen.getByRole("button").className).toContain("#6d28d9");
  });

  it("puts the payment method and date on the paid cell tooltip", () => {
    render(
      <SectionCollectionsMonthCell
        cell={{
          month: 3,
          year: 2026,
          status: "approved",
          expectedAmount: 100,
          fullMonthExpectedAmount: 100,
          currency: "USD",
          proration: null,
          recordedAmount: 100,
          paymentId: "pay-1",
          receiptSignedUrl: null,
          isCurrent: false,
          paymentMethod: "cash",
          paidOn: "2026-03-12",
        }}
        monthLabel="Mar"
        todayMonth={6}
        year={2026}
        ariaPrefix="Ana Student"
        locale="en"
        labels={{
          ...labels,
          paidWithMethod: "Paid {method} · {date}",
          paymentMethodCash: "Cash",
        }}
      />,
    );
    expect(screen.getByRole("button")).toHaveAttribute("title", expect.stringContaining("Cash"));
  });
});
