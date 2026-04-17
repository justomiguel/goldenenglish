import { logServerException } from "@/lib/logging/serverActionLog";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CsvStudentRow } from "@/lib/import/studentRowSchema";
import { loadAuthEmailMap } from "@/lib/import/authEmailMap";
import type { TutorDisplayDefaults } from "@/lib/register/tutorDisplayNameParts";
import { TUTOR_IMPORT_DISPLAY_FALLBACK } from "@/lib/import/tutorImportDisplayDefaults";
import {
  createImportProgressReporter,
  type BulkImportProgressHooks,
} from "@/lib/import/bulkImportStudentsProgress";
import { IMPORT_ROW_UNKNOWN } from "@/lib/import/importResultMessageCodes";
import { processBulkImportStudentRow } from "@/lib/import/bulkImportStudentRow";

export type ImportRowResult = { rowIndex: number; ok: boolean; message: string };

export type BulkImportResult = {
  processed: number;
  createdUsers: number;
  enrolled: number;
  paymentsSeeded: number;
  profilesUpdated: number;
  skippedNoop: number;
  results: ImportRowResult[];
};

export type { BulkImportProgressHooks } from "@/lib/import/bulkImportStudentsProgress";

export async function bulkImportStudentsFromRowsAdmin(
  admin: SupabaseClient,
  rows: CsvStudentRow[],
  tutorDefaults: TutorDisplayDefaults = TUTOR_IMPORT_DISPLAY_FALLBACK,
  hooks?: BulkImportProgressHooks,
): Promise<BulkImportResult> {
  const results: ImportRowResult[] = [];
  let createdUsers = 0;
  let enrolled = 0;
  let paymentsSeeded = 0;
  let profilesUpdated = 0;
  let skippedNoop = 0;

  let emailMap = await loadAuthEmailMap(admin);

  const total = rows.length;
  const { reportDoneRows, onRowStart } = createImportProgressReporter(total, hooks);

  await reportDoneRows(0);

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowIndex = i + 1;
    await onRowStart?.(rowIndex, total);
    try {
      const { outcome, emailMap: nextMap } = await processBulkImportStudentRow(
        admin,
        row,
        tutorDefaults,
        emailMap,
        async () => loadAuthEmailMap(admin),
      );
      emailMap = nextMap;
      if (outcome.kind === "fail") {
        results.push({ rowIndex, ok: false, message: outcome.message });
      } else {
        createdUsers += outcome.createdUsers;
        profilesUpdated += outcome.profilesUpdated;
        enrolled += outcome.enrolled;
        paymentsSeeded += outcome.paymentsSeeded;
        skippedNoop += outcome.skippedNoop;
        results.push({ rowIndex, ok: true, message: outcome.message });
      }
    } catch (rowErr) {
      logServerException("bulkImportStudentsFromRowsAdmin:row", rowErr, { rowIndex });
      results.push({
        rowIndex,
        ok: false,
        message: IMPORT_ROW_UNKNOWN,
      });
    }
    await reportDoneRows(i + 1);
  }

  return {
    processed: rows.length,
    createdUsers,
    enrolled,
    paymentsSeeded,
    profilesUpdated,
    skippedNoop,
    results,
  };
}
