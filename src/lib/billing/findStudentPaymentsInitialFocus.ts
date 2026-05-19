import { periodIndex } from "@/lib/billing/scholarshipPeriod";
import type { StudentMonthlyPaymentsView } from "@/types/studentMonthlyPayments";

export interface StudentPaymentsFocusKey {
  sectionId: string;
  month: number;
}

/** First overdue due/rejected/pending month, else current month on first section. */
export function findStudentPaymentsInitialFocus(
  view: StudentMonthlyPaymentsView,
): StudentPaymentsFocusKey | null {
  if (view.rows.length === 0) return null;
  const todayIdx = periodIndex(view.todayYear, view.todayMonth);

  for (const row of view.rows) {
    for (const cell of row.cells) {
      const idx = periodIndex(cell.year, cell.month);
      if (idx > todayIdx) continue;
      if (
        cell.status === "due" ||
        cell.status === "rejected" ||
        (cell.status === "pending" && cell.paymentId)
      ) {
        return { sectionId: row.sectionId, month: cell.month };
      }
    }
  }

  const first = view.rows[0]!;
  return { sectionId: first.sectionId, month: view.todayMonth };
}
