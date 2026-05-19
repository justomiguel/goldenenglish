import type { StudentMonthlyPaymentSectionRow } from "@/types/studentMonthlyPayments";

/** Unpaid / pending sections first; fully settled sections last. */
export function sortMonthlyPaymentSectionRows(
  rows: StudentMonthlyPaymentSectionRow[],
  isSettled: (row: StudentMonthlyPaymentSectionRow) => boolean,
): StudentMonthlyPaymentSectionRow[] {
  const unpaid: StudentMonthlyPaymentSectionRow[] = [];
  const settled: StudentMonthlyPaymentSectionRow[] = [];
  for (const row of rows) {
    if (isSettled(row)) settled.push(row);
    else unpaid.push(row);
  }
  return [...unpaid, ...settled];
}
