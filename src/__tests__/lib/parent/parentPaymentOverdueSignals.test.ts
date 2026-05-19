import { describe, it, expect } from "vitest";
import {
  countOverdueParentBillingInvoices,
  isParentBillingInvoiceOverdue,
} from "@/lib/parent/parentPaymentOverdueSignals";

describe("isParentBillingInvoiceOverdue", () => {
  const today = "2026-05-19";

  it("treats overdue status as overdue regardless of due date", () => {
    expect(
      isParentBillingInvoiceOverdue({ due_date: "2026-06-01", status: "overdue" }, today),
    ).toBe(true);
  });

  it("treats pending with past due date as overdue", () => {
    expect(
      isParentBillingInvoiceOverdue({ due_date: "2026-05-01", status: "pending" }, today),
    ).toBe(true);
  });

  it("does not treat future pending invoices as overdue", () => {
    expect(
      isParentBillingInvoiceOverdue({ due_date: "2026-06-01", status: "pending" }, today),
    ).toBe(false);
  });

  it("does not treat verifying with future due date as overdue", () => {
    expect(
      isParentBillingInvoiceOverdue({ due_date: "2026-06-15", status: "verifying" }, today),
    ).toBe(false);
  });
});

describe("countOverdueParentBillingInvoices", () => {
  it("counts only past-due open invoices", () => {
    const rows = [
      { due_date: "2026-04-01", status: "pending" as const },
      { due_date: "2026-06-01", status: "pending" as const },
      { due_date: "2026-06-01", status: "overdue" as const },
    ];
    expect(countOverdueParentBillingInvoices(rows, "2026-05-19")).toBe(2);
  });
});
