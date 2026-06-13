import { pickDefaultMonthlyStripFocusMonth } from "@/lib/billing/filterMonthlyStripVisibleCells";
import { isSectionMonthlyPaymentsFullySettled } from "@/lib/billing/isSectionMonthlyPaymentsFullySettled";
import type { Locale } from "@/types/i18n";
import type { StudentMonthlyPaymentsView } from "@/types/studentMonthlyPayments";

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

export interface StudentMonthlyPaymentsStripFocus {
  sectionId: string;
  month?: number;
  enrollment?: boolean;
}

export function pickInitialMonthlyStripFocus(
  rows: StudentMonthlyPaymentsView["rows"],
  filterOpts: { hideNonBillableMonths: boolean; hideSettledMonths?: boolean },
  todayMonth: number,
): StudentMonthlyPaymentsStripFocus | null {
  if (rows.length === 0) return null;
  const first = rows[0]!;
  const month = pickDefaultMonthlyStripFocusMonth(first.cells, filterOpts, todayMonth);
  if (month == null) return null;
  return { sectionId: first.sectionId, month };
}

export function buildDefaultExpandedBySection(
  rows: StudentMonthlyPaymentsView["rows"],
): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  for (const row of rows) {
    map[row.sectionId] = !isSectionMonthlyPaymentsFullySettled(row);
  }
  return map;
}

export function monthlyStripMonthLabels(locale: Locale): string[] {
  return MONTHS.map((m) => {
    const date = new Date(2000, m - 1, 1);
    return new Intl.DateTimeFormat(locale, { month: "short" }).format(date);
  });
}
