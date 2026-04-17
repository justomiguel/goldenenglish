import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ParentHubMonthBillingCard } from "@/components/parent/ParentHubMonthBillingCard";
import dictEn from "@/dictionaries/en.json";

describe("ParentHubMonthBillingCard", () => {
  it("renders count line when invoices match", () => {
    render(
      <ParentHubMonthBillingCard
        locale="en"
        summary={{
          monthTitle: "April 2026",
          invoiceCount: 2,
          totalAmount: 120.5,
          hasPriorOverdue: true,
        }}
        dict={dictEn.dashboard.parent.monthBilling}
      />,
    );
    expect(screen.getByText(dictEn.dashboard.parent.monthBilling.priorHint)).toBeInTheDocument();
    expect(screen.getByText(/2 open invoice/)).toBeInTheDocument();
  });
});
