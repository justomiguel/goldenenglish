import type { BillingInvoiceStatus } from "@/types/billing";
import { buildStudentPaymentsYearSummary } from "@/lib/billing/buildStudentPaymentsYearSummary";
import type { StudentMonthlyPaymentsView } from "@/types/studentMonthlyPayments";

export type ParentBillingInvoiceOverdueRow = {
  due_date: string;
  status: BillingInvoiceStatus;
};

/** True when an open invoice is past due (overdue status or due date before today). */
export function isParentBillingInvoiceOverdue(
  row: ParentBillingInvoiceOverdueRow,
  todayYmd: string,
): boolean {
  if (row.status === "overdue") return true;
  if (row.status !== "pending" && row.status !== "verifying") return false;
  return row.due_date.slice(0, 10) < todayYmd;
}

export function countOverdueParentBillingInvoices(
  rows: ParentBillingInvoiceOverdueRow[],
  todayYmd: string,
): number {
  return rows.filter((row) => isParentBillingInvoiceOverdue(row, todayYmd)).length;
}

/** Past-due monthly cells only — upcoming months and receipt review do not count. */
export function studentMonthlyPaymentsViewHasOverdueBalance(
  view: StudentMonthlyPaymentsView,
): boolean {
  return buildStudentPaymentsYearSummary(view).overdue > 0;
}
