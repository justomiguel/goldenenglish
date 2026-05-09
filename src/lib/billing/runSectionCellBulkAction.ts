import {
  runRecordPaymentExemptBulk,
  runRecordPaymentPaidBulk,
  runRecordPaymentScholarshipBulk,
} from "@/lib/dashboard/adminRecordPaymentBulkRunners";
import type { Dictionary, Locale } from "@/types/i18n";

export type SectionCellBulkActionType = "paid" | "scholarship" | "exempt";

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
  const failedMessages: string[] = [];

  for (const [studentId, months] of cellsByStudent) {
    let result: { ok: boolean; message: string };

    switch (action) {
      case "paid":
        result = await runRecordPaymentPaidBulk({
          studentId,
          sectionId,
          year,
          months,
          locale,
          adminNote: note,
          labels,
        });
        break;
      case "scholarship":
        result = await runRecordPaymentScholarshipBulk({
          locale,
          studentId,
          sectionId,
          year,
          months,
          discountPercent: scholarshipPercent ?? 0,
          note,
          labels,
        });
        break;
      case "exempt":
        result = await runRecordPaymentExemptBulk({
          locale,
          studentId,
          sectionId,
          year,
          months,
          adminNote: note ?? "",
          labels,
        });
        break;
    }

    if (result.ok) {
      successCount += months.length;
    } else {
      failedCount += months.length;
      failedMessages.push(result.message);
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
