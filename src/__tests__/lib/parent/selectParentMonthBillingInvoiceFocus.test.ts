import { describe, it, expect } from "vitest";
import { selectParentMonthBillingInvoiceFocus } from "@/lib/parent/selectParentMonthBillingInvoiceFocus";

describe("selectParentMonthBillingInvoiceFocus", () => {
  it("includes due dates in the month and overdue before month start", () => {
    const rows = [
      { due_date: "2026-04-05", status: "pending" as const, amount: 10 },
      { due_date: "2026-03-01", status: "pending" as const, amount: 5 },
      { due_date: "2026-03-01", status: "overdue" as const, amount: 7 },
      { due_date: "2026-04-20", status: "paid" as const, amount: 1 },
    ];
    const out = selectParentMonthBillingInvoiceFocus(rows, "2026-04-01", "2026-04-30");
    expect(out).toHaveLength(2);
    expect(out.map((r) => r.amount)).toEqual([10, 7]);
  });
});
