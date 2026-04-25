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
  });
});
