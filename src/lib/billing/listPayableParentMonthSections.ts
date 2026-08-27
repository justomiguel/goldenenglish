import { isAdvanceMonthlyPaymentAllowedForCell } from "@/lib/billing/assertAdvanceMonthlyPaymentAllowed";
import type {
  StudentMonthlyPaymentCell,
  StudentMonthlyPaymentSectionRow,
  StudentMonthlyPaymentsView,
} from "@/types/studentMonthlyPayments";

export type ParentMonthlyPayScope = "current" | "all";

export type PayableParentMonthLine = {
  sectionId: string;
  sectionName: string;
  amount: number;
  currency: string;
  scholarshipDiscountPercent: number | null;
};

export type PayableParentMonthSections = {
  lines: PayableParentMonthLine[];
  total: number;
  currency: string | null;
};

function cellAmount(cell: StudentMonthlyPaymentCell, useFullMonthAmount: boolean): number | null {
  const raw = useFullMonthAmount
    ? (cell.fullMonthExpectedAmount ?? cell.expectedAmount)
    : cell.expectedAmount;
  if (raw == null || !Number.isFinite(raw) || raw <= 0) return null;
  return raw;
}

function isPayableCell(
  row: StudentMonthlyPaymentSectionRow,
  cell: StudentMonthlyPaymentCell,
  todayYear: number,
  todayMonth: number,
  useFullMonthAmount: boolean,
): boolean {
  if (cell.status !== "due" && cell.status !== "rejected") return false;
  if (cellAmount(cell, useFullMonthAmount) == null) return false;
  if (
    !isAdvanceMonthlyPaymentAllowedForCell(
      row.allowAdvanceMonthlyPayment,
      cell.year,
      cell.month,
      todayYear,
      todayMonth,
    )
  ) {
    return false;
  }
  const currency = (cell.currency ?? "").trim();
  return currency.length > 0;
}

function lineFrom(
  row: StudentMonthlyPaymentSectionRow,
  cell: StudentMonthlyPaymentCell,
  useFullMonthAmount: boolean,
): PayableParentMonthLine {
  const amount = cellAmount(cell, useFullMonthAmount);
  if (amount == null) {
    throw new Error("listPayableParentMonthSections: expected payable amount");
  }
  const percent = cell.scholarshipDiscountPercent;
  return {
    sectionId: row.sectionId,
    sectionName: row.sectionName,
    amount,
    currency: (cell.currency ?? "").trim().toUpperCase(),
    scholarshipDiscountPercent:
      percent != null && percent > 0 && percent < 100 ? percent : null,
  };
}

export function listPayableParentMonthSections(input: {
  view: StudentMonthlyPaymentsView;
  originSectionId: string;
  month: number;
  year: number;
  scope: ParentMonthlyPayScope;
  useFullMonthAmount: boolean;
}): PayableParentMonthSections {
  const empty: PayableParentMonthSections = { lines: [], total: 0, currency: null };
  const origin = input.view.rows.find((r) => r.sectionId === input.originSectionId);
  if (!origin) return empty;

  const originCell = origin.cells.find((c) => c.month === input.month && c.year === input.year);
  if (!originCell) return empty;

  const originPayable = isPayableCell(
    origin,
    originCell,
    input.view.todayYear,
    input.view.todayMonth,
    input.useFullMonthAmount,
  );

  if (input.scope === "current") {
    if (!originPayable) return empty;
    const line = lineFrom(origin, originCell, input.useFullMonthAmount);
    return { lines: [line], total: line.amount, currency: line.currency };
  }

  const originCurrency = (originCell.currency ?? "").trim().toUpperCase();
  const lines: PayableParentMonthLine[] = [];
  for (const row of input.view.rows) {
    const cell = row.cells.find((c) => c.month === input.month && c.year === input.year);
    if (!cell) continue;
    if (
      !isPayableCell(row, cell, input.view.todayYear, input.view.todayMonth, input.useFullMonthAmount)
    ) {
      continue;
    }
    const cur = (cell.currency ?? "").trim().toUpperCase();
    if (originCurrency && cur !== originCurrency) continue;
    lines.push(lineFrom(row, cell, input.useFullMonthAmount));
  }

  const total = lines.reduce((sum, line) => sum + line.amount, 0);
  return { lines, total, currency: lines[0]?.currency ?? null };
}
