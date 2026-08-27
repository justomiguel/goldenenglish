import { render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it } from "vitest";
import { AdminBillingSectionFeeSummary } from "@/components/dashboard/AdminBillingSectionFeeSummary";

const labels = {
  enrollmentLabel: "Enrollment fee",
  monthlyLabel: "Monthly fee (current plan)",
  monthlyUnavailable: "No active fee plan",
  enrollmentNotCharged: "No enrollment fee",
};

function renderSummary(
  override: Partial<ComponentProps<typeof AdminBillingSectionFeeSummary>> = {},
) {
  return render(
    <AdminBillingSectionFeeSummary
      locale="en"
      enrollmentAmount={0}
      enrollmentCurrency="USD"
      monthlyAmount={120}
      monthlyCurrency="USD"
      labels={labels}
      {...override}
    />,
  );
}

describe("AdminBillingSectionFeeSummary", () => {
  it("shows only the list monthly fee when there is no scholarship average", () => {
    renderSummary();

    expect(screen.getByText("$120")).toBeInTheDocument();
    expect(screen.queryByRole("deletion")).not.toBeInTheDocument();
  });

  it("strikes the list monthly fee and shows the scholarship average", () => {
    renderSummary({ effectiveMonthlyAmount: 60 });

    const struck = screen.getByRole("deletion");
    expect(struck).toHaveTextContent("$120");
    expect(screen.getByText("$60")).toBeInTheDocument();
  });

  it("shows 0 when the average after scholarship or exemption is zero", () => {
    renderSummary({ effectiveMonthlyAmount: 0 });

    expect(screen.getByRole("deletion")).toHaveTextContent("$120");
    expect(screen.getByText("$0")).toBeInTheDocument();
  });

  it("keeps the unavailable label when there is no list monthly fee", () => {
    renderSummary({
      monthlyAmount: null,
      monthlyCurrency: null,
      effectiveMonthlyAmount: 0,
    });

    expect(screen.getByText(labels.monthlyUnavailable)).toBeInTheDocument();
    expect(screen.queryByRole("deletion")).not.toBeInTheDocument();
  });
});
