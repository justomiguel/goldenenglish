import { effectiveScholarshipPercentForPeriod } from "@/lib/billing/scholarshipPeriod";
import type {
  AdminBillingPaymentRow,
  AdminBillingScholarship,
} from "@/types/adminStudentBilling";

export type AdminBillingMonthStatus =
  | "paid"
  | "pending"
  | "rejected"
  | "exempt"
  | "unpaid";

export interface AdminBillingMonthState {
  month: number;
  status: AdminBillingMonthStatus;
  paymentId: string | null;
  recordedAmount: number | null;
  scholarshipPercent: number | null;
  selectable: boolean;
  legacyFallback: boolean;
}

interface BuildAdminBillingMonthGridInput {
  payments: AdminBillingPaymentRow[];
  scholarships: AdminBillingScholarship[];
  sectionId: string;
  year: number;
}

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

function paymentStatus(status: string | null): AdminBillingMonthStatus {
  switch (status) {
    case "approved":
      return "paid";
    case "pending":
    case "pending_approval":
      return "pending";
    case "rejected":
      return "rejected";
    case "exempt":
      return "exempt";
    default:
      return "unpaid";
  }
}

function paymentsForPeriod(
  payments: AdminBillingPaymentRow[],
  year: number,
  month: number,
): AdminBillingPaymentRow[] {
  return payments.filter((p) => p.year === year && p.month === month);
}

/** Scope aligned with Finance section collections (payments for this `section_id`). */
function findSectionPaymentForMonth(
  payments: AdminBillingPaymentRow[],
  sectionId: string,
  year: number,
  month: number,
): AdminBillingPaymentRow | null {
  return (
    paymentsForPeriod(payments, year, month).find((p) => p.section_id === sectionId) ??
    null
  );
}

/** Rows predating section attribution (`section_id` null). */
function findLegacyPaymentForMonth(
  payments: AdminBillingPaymentRow[],
  year: number,
  month: number,
): AdminBillingPaymentRow | null {
  return (
    paymentsForPeriod(payments, year, month).find((p) => p.section_id === null) ??
    null
  );
}

export function buildAdminBillingMonthGrid({
  payments,
  scholarships,
  sectionId,
  year,
}: BuildAdminBillingMonthGridInput): AdminBillingMonthState[] {
  return MONTHS.map((month) => {
    const sectionPayment = findSectionPaymentForMonth(payments, sectionId, year, month);
    const legacyPayment = findLegacyPaymentForMonth(payments, year, month);
    const status = paymentStatus(sectionPayment?.status ?? null);
    /** Legacy-only period: Cobranzas has no row for this section; block duplicate recording. */
    const legacyFallback = Boolean(legacyPayment && !sectionPayment);
    const scholarshipPercent = effectiveScholarshipPercentForPeriod(
      scholarships,
      year,
      month,
    );

    return {
      month,
      status,
      paymentId: sectionPayment?.id ?? null,
      recordedAmount: sectionPayment?.amount ?? null,
      scholarshipPercent: scholarshipPercent > 0 ? scholarshipPercent : null,
      selectable: !legacyFallback && status !== "paid" && status !== "exempt",
      legacyFallback,
    };
  });
}
