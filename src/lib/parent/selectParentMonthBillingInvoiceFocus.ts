import type { BillingInvoiceStatus } from "@/types/billing";

export type ParentMonthInvoiceRow = {
  due_date: string;
  status: BillingInvoiceStatus;
  amount: number;
};

const OPEN: BillingInvoiceStatus[] = ["pending", "verifying", "overdue"];

/**
 * Invoices to highlight on the parent home: due this institute month, or overdue from earlier months.
 */
export function selectParentMonthBillingInvoiceFocus(
  rows: ParentMonthInvoiceRow[],
  monthStart: string,
  monthEnd: string,
): ParentMonthInvoiceRow[] {
  return rows.filter((r) => {
    if (!OPEN.includes(r.status)) return false;
    const d = r.due_date.slice(0, 10);
    if (d >= monthStart && d <= monthEnd) return true;
    if (r.status === "overdue" && d < monthStart) return true;
    return false;
  });
}
