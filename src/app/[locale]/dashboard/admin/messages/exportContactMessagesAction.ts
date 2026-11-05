"use server";

import { z } from "zod";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { resolveIsAdminSession } from "@/lib/auth/resolveIsAdminSession";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { loadReceiptBrandForRequest } from "@/lib/billing/loadReceiptBrandForRequest";
import { logServerAuthzDenied, logServerException } from "@/lib/logging/serverActionLog";
import {
  CONTACT_MESSAGE_EXPORT_FIELD_ORDER,
  orderContactMessageExportFields,
  type ContactMessageExportField,
  type ContactMessageExportScope,
} from "@/lib/messaging/export/contactMessageExportContract";
import { loadContactMessagesForExport } from "@/lib/messaging/export/loadContactMessagesForExport";
import {
  buildContactMessageExportTable,
  formatContactMessageExportDay,
  formatContactMessageExportInstant,
  parseContactMessageExportRow,
} from "@/lib/messaging/export/parseContactMessageExportRow";
import { buildContactMessagesXlsxArtifact } from "@/lib/messaging/export/buildContactMessagesXlsxArtifact";
import { buildContactMessagesPdfArtifact } from "@/lib/messaging/export/buildContactMessagesPdfArtifact";
import { getProperty } from "@/lib/theme/themeParser";
import { loadEffectiveProperties } from "@/lib/theme/loadEffectiveProperties";

const FALLBACK_TIME_ZONE = "America/Argentina/Cordoba";

const exportSchema = z.object({
  locale: z.enum(["es", "en", "pt"]),
  format: z.enum(["xlsx", "pdf"]),
  scope: z.enum(["all", "latest_2000"]),
  fields: z.array(z.enum(CONTACT_MESSAGE_EXPORT_FIELD_ORDER)).min(1),
});

export type ExportContactMessagesResult =
  | {
      ok: true;
      artifact: { filename: string; mimeType: string; base64: string };
    }
  | { ok: false; message: string };

export async function exportContactMessagesAction(input: {
  locale: string;
  format: "xlsx" | "pdf";
  scope: ContactMessageExportScope;
  fields: ContactMessageExportField[];
}): Promise<ExportContactMessagesResult> {
  const parsed = exportSchema.safeParse(input);
  const locale = parsed.success ? parsed.data.locale : "es";
  const dict = await getDictionary(locale);
  const copy = dict.admin.messages.contactExport;
  const forbidden = dict.actionErrors.admin.forbidden;

  if (!parsed.success) return { ok: false, message: copy.exportError };

  const { format, scope, fields } = parsed.data;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      await logServerAuthzDenied("exportContactMessagesAction", { reason: "no_session" });
      return { ok: false, message: forbidden };
    }
    const isAdmin = await resolveIsAdminSession(supabase, user.id);
    if (!isAdmin) {
      await logServerAuthzDenied("exportContactMessagesAction", { reason: "not_admin" });
      return { ok: false, message: forbidden };
    }

    const loaded = await loadContactMessagesForExport(supabase, user.id, scope);
    if (!loaded.ok) return { ok: false, message: copy.exportError };
    if (loaded.rows.length === 0) return { ok: false, message: copy.exportEmpty };

    const [brand, effective] = await Promise.all([
      loadReceiptBrandForRequest(),
      loadEffectiveProperties(),
    ]);
    const timeZone =
      getProperty(effective.properties, "analytics.timezone", FALLBACK_TIME_ZONE).trim() ||
      FALLBACK_TIME_ZONE;
    const orderedFields = orderContactMessageExportFields(fields);
    const values = loaded.rows.map((row) =>
      parseContactMessageExportRow(row, { locale, timeZone }),
    );
    const table = buildContactMessageExportTable({
      rows: values,
      fields: orderedFields,
      labels: {
        sentAt: copy.fieldSentAt,
        name: copy.fieldName,
        email: copy.fieldEmail,
        phone: copy.fieldPhone,
        subject: copy.fieldSubject,
        body: copy.fieldBody,
      },
    });
    const now = new Date();
    const meta = {
      documentTitle: copy.documentTitle,
      exportedAtLabel: copy.exportedAt,
      rowCountLabel: copy.rowCount,
      sheetName: copy.sheetName,
      exportedAt: formatContactMessageExportInstant(now.toISOString(), locale, timeZone),
      rowCount: values.length,
    };
    const fileInput = {
      exportedOn: formatContactMessageExportDay(timeZone, now),
      brand: {
        instituteName: brand.name,
        legalName: brand.legalName,
        legalRegistry: brand.legalRegistry,
        logoUrl: brand.logoUrl.trim() ? brand.logoUrl : null,
        primaryColor: brand.primaryColor,
      },
      meta,
      headers: table.headers,
      rows: table.rows,
    };
    const artifact =
      format === "xlsx"
        ? await buildContactMessagesXlsxArtifact(fileInput)
        : await buildContactMessagesPdfArtifact(fileInput);

    await recordSystemAudit({
      action: "admin_contact_messages_exported",
      resourceType: "portal_messages",
      payload: { format, scope, fields: orderedFields, rowCount: values.length },
    });

    return { ok: true, artifact };
  } catch (error) {
    await logServerException("exportContactMessagesAction", error, { format, scope });
    return { ok: false, message: copy.exportError };
  }
}
