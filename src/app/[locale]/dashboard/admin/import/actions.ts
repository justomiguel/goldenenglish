"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { csvStudentRowsSchema } from "@/lib/import/studentRowSchema";
import { bulkImportStudentsFromRowsAdmin } from "@/lib/import/bulkImportStudents";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { IMPORT_INVALID_CSV_PAYLOAD } from "@/lib/import/parseImportErrorCodes";
import { auditIdentityAction } from "@/lib/audit";

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
  const { user } = await assertAdmin();

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
  const result = await bulkImportStudentsFromRowsAdmin(admin, parsed.data, tutorDefaults);
  void auditIdentityAction({
    actorId: user.id,
    actorRole: "admin",
    action: "create",
    resourceType: "student_import",
    summary: "Admin imported students from CSV rows",
    afterValues: {
      processed: result.processed,
      created_users: result.createdUsers,
      enrolled: result.enrolled,
      payments_seeded: result.paymentsSeeded,
      profiles_updated: result.profilesUpdated,
      skipped_noop: result.skippedNoop,
    },
    metadata: {
      row_count: parsed.data.length,
      failed_rows: result.results.filter((row) => !row.ok).length,
    },
  });
  return result;
}
