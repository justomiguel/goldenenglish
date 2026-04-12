"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { csvStudentRowsSchema } from "@/lib/import/studentRowSchema";
import { bulkImportStudentsFromRowsAdmin } from "@/lib/import/bulkImportStudents";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { IMPORT_INVALID_CSV_PAYLOAD } from "@/lib/import/parseImportErrorCodes";

export type ImportRowResult = {
  rowIndex: number;
  ok: boolean;
  message: string;
};

export type BulkImportResult = {
  processed: number;
  createdUsers: number;
  enrolled: number;
  paymentsSeeded: number;
  profilesUpdated: number;
  skippedNoop: number;
  results: ImportRowResult[];
};

export async function bulkImportStudentsFromRows(
  locale: string,
  rows: unknown[],
): Promise<BulkImportResult> {
  await assertAdmin();

  const parsed = csvStudentRowsSchema.safeParse(rows);
  if (!parsed.success) {
    throw new Error(IMPORT_INVALID_CSV_PAYLOAD);
  }

  const dict = await getDictionary(locale);
  const tutorDefaults = {
    defaultFirstName: dict.admin.registrations.tutorAccountDefaultFirst,
    emptyLastName: dict.admin.registrations.emptyValue,
  };

  const admin = createAdminClient();
  return bulkImportStudentsFromRowsAdmin(admin, parsed.data, tutorDefaults);
}
