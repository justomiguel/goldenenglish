"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { csvStudentRowsSchema } from "@/lib/import/studentRowSchema";
import { bulkImportStudentsFromRowsAdmin } from "@/lib/import/bulkImportStudents";

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
  results: ImportRowResult[];
};

export async function bulkImportStudentsFromRows(
  rows: unknown[],
): Promise<BulkImportResult> {
  await assertAdmin();

  const parsed = csvStudentRowsSchema.safeParse(rows);
  if (!parsed.success) {
    throw new Error("Invalid CSV payload");
  }

  const admin = createAdminClient();
  return bulkImportStudentsFromRowsAdmin(admin, parsed.data);
}
