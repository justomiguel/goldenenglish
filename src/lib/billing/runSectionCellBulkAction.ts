import { bulkSectionEnrollmentExemptionAction } from "@/app/[locale]/dashboard/admin/finance/collections/[sectionId]/bulkSectionEnrollmentExemptionAction";
import { markEnrollmentFeePaidNow } from "@/app/[locale]/dashboard/admin/users/[userId]/billing/enrollmentFeeActions";
import { uniqueSortedMonths } from "@/app/[locale]/dashboard/admin/payments/recordPaymentWithoutReceiptActionShared";
import {
  runRecordPaymentExemptBulk,
  runRecordPaymentPaidBulk,
  runRecordPaymentScholarshipBulk,
  runRecordEnrollmentYearScholarshipBulk,
  runRevertApprovedPaymentsBulk,
} from "@/lib/dashboard/adminRecordPaymentBulkRunners";
import { SECTION_COLLECTIONS_ENROLLMENT_FEE_CELL_MONTH } from "@/lib/billing/sectionCollectionsEnrollmentFeeCellMonth";
import type { Dictionary, Locale } from "@/types/i18n";

export type SectionCellBulkActionType = "paid" | "scholarship" | "exempt" | "revert";

export interface SectionCellBulkActionInput {
  action: SectionCellBulkActionType;
  sectionId: string;
  year: number;
  cellsByStudent: Map<string, number[]>;
  locale: Locale;
  labels: Dictionary["admin"]["billing"];
  scholarshipPercent?: number;
  note?: string;
}

export interface SectionCellBulkActionResult {
  ok: boolean;
  totalCells: number;
  successCount: number;
  failedCount: number;
  message: string;
}

function monthlySubset(months: number[]): number[] {
  return uniqueSortedMonths(months);
}

function hasEnrollmentFeeCell(months: number[]): boolean {
  return months.includes(SECTION_COLLECTIONS_ENROLLMENT_FEE_CELL_MONTH);
}

export async function runSectionCellBulkAction({
  action,
  sectionId,
  year,
  cellsByStudent,
  locale,
  labels,
  scholarshipPercent,
  note,
}: SectionCellBulkActionInput): Promise<SectionCellBulkActionResult> {
  const totalCells = Array.from(cellsByStudent.values()).reduce(
    (sum, months) => sum + months.length,
    0,
  );

  let successCount = 0;
  let failedCount = 0;

  const enrollmentIdsForExempt = new Set<string>();

  for (const [studentId, months] of cellsByStudent) {
    const monthlyMonths = monthlySubset(months);
    const enrollmentSel = hasEnrollmentFeeCell(months);

    if (action === "exempt" && enrollmentSel) {
      enrollmentIdsForExempt.add(studentId);
    }

    switch (action) {
      case "paid": {
        if (monthlyMonths.length > 0) {
          const result = await runRecordPaymentPaidBulk({
            studentId,
            sectionId,
            year,
            months: monthlyMonths,
            locale,
            adminNote: note,
            labels,
          });
          if (result.ok) successCount += monthlyMonths.length;
          else failedCount += monthlyMonths.length;
        }
        if (enrollmentSel) {
          const r = await markEnrollmentFeePaidNow({ locale, studentId, sectionId });
          if (r.ok) successCount += 1;
          else failedCount += 1;
        }
        break;
      }
      case "scholarship": {
        if (monthlyMonths.length > 0) {
          const result = await runRecordPaymentScholarshipBulk({
            locale,
            studentId,
            sectionId,
            year,
            months: monthlyMonths,
            discountPercent: scholarshipPercent ?? 0,
            note,
            labels,
          });
          if (result.ok) successCount += monthlyMonths.length;
          else failedCount += monthlyMonths.length;
        }
        if (enrollmentSel) {
          const r = await runRecordEnrollmentYearScholarshipBulk({
            locale,
            studentId,
            sectionId,
            year,
            discountPercent: scholarshipPercent ?? 0,
            note,
            labels,
          });
          if (r.ok) successCount += 1;
          else failedCount += 1;
        }
        break;
      }
      case "exempt": {
        if (monthlyMonths.length > 0) {
          const result = await runRecordPaymentExemptBulk({
            locale,
            studentId,
            sectionId,
            year,
            months: monthlyMonths,
            adminNote: note ?? "",
            labels,
          });
          if (result.ok) successCount += monthlyMonths.length;
          else failedCount += monthlyMonths.length;
        }
        break;
      }
      case "revert": {
        if (monthlyMonths.length > 0) {
          const result = await runRevertApprovedPaymentsBulk({
            studentId,
            sectionId,
            year,
            months: monthlyMonths,
            locale,
            adminNote: note,
            labels,
          });
          if (result.ok) successCount += monthlyMonths.length;
          else failedCount += monthlyMonths.length;
        }
        break;
      }
    }
  }

  if (action === "exempt" && enrollmentIdsForExempt.size > 0) {
    const r = await bulkSectionEnrollmentExemptionAction({
      locale,
      sectionId,
      studentIds: [...enrollmentIdsForExempt],
      exempt: true,
      reason: note,
    });
    const n = enrollmentIdsForExempt.size;
    if (r.ok) {
      const updated = r.updatedCount ?? n;
      successCount += updated;
      failedCount += n - updated;
    } else {
      failedCount += n;
    }
  }

  const allOk = failedCount === 0;
  const message = allOk
    ? `${successCount} period(s) updated.`
    : `${successCount} updated, ${failedCount} failed.`;

  return {
    ok: allOk,
    totalCells,
    successCount,
    failedCount,
    message,
  };
}
