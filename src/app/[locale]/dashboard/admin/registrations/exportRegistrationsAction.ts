"use server";

import ExcelJS from "exceljs";
import { z } from "zod";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { loadPaginatedRegistrations } from "@/lib/dashboard/loadPaginatedRegistrations";
import {
  REGISTRATION_INBOX_FILTERS,
  type RegistrationInboxFilter,
} from "@/lib/register/registrationInboxFilter";
import { loadActiveTheme } from "@/lib/theme/loadActiveTheme";
import { buildRegistrationsExportTable } from "@/lib/register/buildRegistrationsExportTable";
import { logServerAuthzDenied, logServerException } from "@/lib/logging/serverActionLog";
import type { Locale } from "@/types/i18n";

/** One page of leads is a call sheet; the whole table is a data dump. */
const EXPORT_MAX_ROWS = 2000;

const inputZ = z.object({
  locale: z.string().min(2).max(8),
  q: z.string().max(200).optional(),
  status: z.enum(["new", "contacted"]).optional(),
  inbox: z.enum(REGISTRATION_INBOX_FILTERS).optional(),
});

export type ExportRegistrationsResult =
  | { ok: true; artifact: { base64: string; filename: string; mimeType: string } }
  | { ok: false; message: string };

export async function exportRegistrationsAction(input: {
  locale: string;
  q?: string;
  status?: "new" | "contacted";
  inbox?: RegistrationInboxFilter;
}): Promise<ExportRegistrationsResult> {
  const parsed = inputZ.safeParse(input);
  if (!parsed.success) return { ok: false, message: "validation" };

  const dict = await getDictionary(parsed.data.locale as Locale);
  const labels = dict.admin.registrations;

  try {
    try {
      await assertAdmin();
    } catch {
      logServerAuthzDenied("exportRegistrationsAction");
      return { ok: false, message: dict.actionErrors.registrationDraft.forbidden };
    }

    const admin = createAdminClient();
    const result = await loadPaginatedRegistrations(admin, {
      page: 1,
      pageSize: EXPORT_MAX_ROWS,
      q: parsed.data.q,
      status: parsed.data.status,
      inbox: parsed.data.inbox,
    });

    let activeTemplateKind = "classic";
    try {
      const snapshot = await loadActiveTheme();
      activeTemplateKind = snapshot?.theme.templateKind ?? "classic";
    } catch {
      activeTemplateKind = "classic";
    }
    const table = buildRegistrationsExportTable(result.rows, labels, {
      locale: parsed.data.locale,
      activeTemplateKind,
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(labels.title.slice(0, 31));
    sheet.addRow(table.headers);
    sheet.getRow(1).font = { bold: true };
    for (const row of table.rows) sheet.addRow(row);
    sheet.columns.forEach((column) => {
      column.width = Math.min(32, Math.max(14, Number(column.width ?? 16)));
    });

    const base64 = Buffer.from(await workbook.xlsx.writeBuffer()).toString("base64");

    await recordSystemAudit({
      action: "registrations_spreadsheet_export",
      resourceType: "registrations",
      payload: {
        rowCount: result.rows.length,
        status: parsed.data.status ?? "all",
        hasQuery: Boolean(parsed.data.q?.trim()),
      },
    });

    return {
      ok: true,
      artifact: {
        base64,
        filename: `inscripciones_${new Date().toISOString().slice(0, 10)}.xlsx`,
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    };
  } catch (err) {
    logServerException("exportRegistrationsAction", err, {});
    return { ok: false, message: labels.exportError };
  }
}
