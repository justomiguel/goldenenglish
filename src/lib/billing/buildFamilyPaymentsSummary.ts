import { periodIndex } from "@/lib/billing/scholarshipPeriod";
import type { BillingInvoiceRow, BillingInvoiceStatus } from "@/types/billing";
import type { StudentMonthlyPaymentsView } from "@/types/studentMonthlyPayments";

const OPEN_INVOICE_STATUSES: BillingInvoiceStatus[] = ["pending", "verifying", "overdue"];

export type FamilyPaymentLineKind =
  | "monthly_overdue"
  | "monthly_pending_review"
  | "monthly_upcoming"
  | "invoice"
  | "enrollment";

export interface FamilyPaymentLine {
  kind: FamilyPaymentLineKind;
  sectionId: string | null;
  label: string;
  amount: number;
  status?: string;
  month?: number;
  year?: number;
  invoiceId?: string;
}

export interface FamilyPaymentChildSummary {
  studentId: string;
  displayName: string;
  financialAccessActive: boolean;
  subtotal: number;
  lines: FamilyPaymentLine[];
}

export interface FamilyPaymentsSummary {
  year: number;
  familyTotalPending: number;
  isFamilySettled: boolean;
  children: FamilyPaymentChildSummary[];
}

export interface FamilyPaymentsChildInput {
  studentId: string;
  displayName: string;
  financialAccessActive: boolean;
  monthlyView: StudentMonthlyPaymentsView | null;
  invoices: BillingInvoiceRow[];
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function openInvoiceAmount(invoices: BillingInvoiceRow[]): number {
  return invoices
    .filter((i) => OPEN_INVOICE_STATUSES.includes(i.status))
    .reduce((sum, i) => sum + Number(i.amount), 0);
}

function isEnrollmentTaggedInvoice(inv: BillingInvoiceRow): boolean {
  const desc = (inv.description ?? "").toLowerCase();
  return desc.includes("matr") || desc.includes("enroll");
}

function hasOpenEnrollmentInvoice(invoices: BillingInvoiceRow[]): boolean {
  return invoices.some(
    (inv) => OPEN_INVOICE_STATUSES.includes(inv.status) && isEnrollmentTaggedInvoice(inv),
  );
}

function pendingEnrollmentLines(
  view: StudentMonthlyPaymentsView,
  invoices: BillingInvoiceRow[],
): FamilyPaymentLine[] {
  if (hasOpenEnrollmentInvoice(invoices)) return [];

  const lines: FamilyPaymentLine[] = [];
  for (const row of view.rows) {
    if (row.enrollmentFeeExempt || row.enrollmentFeeAmount <= 0) continue;
    if (row.lastEnrollmentPaidAt) continue;
    if (row.enrollmentFeeReceiptStatus === "approved") continue;

    lines.push({
      kind: "enrollment",
      sectionId: row.sectionId,
      label: row.sectionName,
      amount: round2(row.enrollmentFeeAmount),
      status: row.enrollmentFeeReceiptStatus ?? "pending",
    });
  }
  return lines;
}

function monthlyLinesFromView(view: StudentMonthlyPaymentsView): FamilyPaymentLine[] {
  const todayIdx = periodIndex(view.todayYear, view.todayMonth);
  const lines: FamilyPaymentLine[] = [];

  for (const row of view.rows) {
    for (const cell of row.cells) {
      const expected = cell.expectedAmount ?? 0;
      if (expected <= 0 && cell.status !== "pending") continue;

      const cellIdx = periodIndex(cell.year, cell.month);
      const monthLabel = `${cell.year}-${String(cell.month).padStart(2, "0")}`;

      if (cell.status === "pending") {
        const amt = cell.recordedAmount ?? expected;
        if (amt > 0) {
          lines.push({
            kind: "monthly_pending_review",
            sectionId: row.sectionId,
            label: `${row.sectionName} · ${monthLabel}`,
            amount: round2(amt),
            status: "pending",
            month: cell.month,
            year: cell.year,
          });
        }
        continue;
      }

      if (cell.status === "due" || cell.status === "rejected") {
        if (cellIdx < todayIdx) {
          lines.push({
            kind: "monthly_overdue",
            sectionId: row.sectionId,
            label: `${row.sectionName} · ${monthLabel}`,
            amount: round2(expected),
            status: cell.status,
            month: cell.month,
            year: cell.year,
          });
        } else {
          lines.push({
            kind: "monthly_upcoming",
            sectionId: row.sectionId,
            label: `${row.sectionName} · ${monthLabel}`,
            amount: round2(expected),
            status: "due",
            month: cell.month,
            year: cell.year,
          });
        }
      }
    }
  }

  return lines;
}

function invoiceLines(invoices: BillingInvoiceRow[]): FamilyPaymentLine[] {
  return invoices
    .filter((i) => OPEN_INVOICE_STATUSES.includes(i.status))
    .map((inv) => ({
      kind: "invoice" as const,
      sectionId: null,
      label: inv.description?.trim() || inv.id,
      amount: round2(Number(inv.amount)),
      status: inv.status,
      invoiceId: inv.id,
    }));
}

/**
 * Aggregates pending amounts per linked child: monthly grid (year summary logic)
 * plus open billing invoices and section enrollment fees (without double-counting
 * enrollment when an open enrollment-tagged invoice exists).
 */
export function buildFamilyPaymentsSummary(
  childrenInput: FamilyPaymentsChildInput[],
): FamilyPaymentsSummary {
  const year =
    childrenInput.find((c) => c.monthlyView)?.monthlyView?.todayYear ??
    new Date().getFullYear();

  const children: FamilyPaymentChildSummary[] = childrenInput.map((child) => {
    if (!child.financialAccessActive || !child.monthlyView) {
      return {
        studentId: child.studentId,
        displayName: child.displayName,
        financialAccessActive: child.financialAccessActive,
        subtotal: 0,
        lines: [],
      };
    }

    const lines: FamilyPaymentLine[] = [
      ...monthlyLinesFromView(child.monthlyView),
      ...invoiceLines(child.invoices),
      ...pendingEnrollmentLines(child.monthlyView, child.invoices),
    ];

    const subtotal = round2(lines.reduce((a, l) => a + l.amount, 0));

    return {
      studentId: child.studentId,
      displayName: child.displayName,
      financialAccessActive: child.financialAccessActive,
      subtotal,
      lines,
    };
  });

  const familyTotalPending = round2(
    children
      .filter((c) => c.financialAccessActive)
      .reduce((a, c) => a + c.subtotal, 0),
  );

  return {
    year,
    familyTotalPending,
    isFamilySettled: familyTotalPending <= 0,
    children,
  };
}
