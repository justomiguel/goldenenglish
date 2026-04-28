"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { resolveIsAdminSession } from "@/lib/auth/resolveIsAdminSession";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { getEmailProvider } from "@/lib/email/getEmailProvider";
import { sendStaffMessageUseCase } from "@/lib/messaging/useCases/sendStaffMessage";
import { sanitizeMessageHtml } from "@/lib/messaging/sanitizeMessageHtml";
import { stripHtmlToText } from "@/lib/messaging/stripHtml";
import { mapMessagingUseCaseCode } from "@/lib/messaging/mapMessagingUseCaseCode";
import { loadAdminSectionCollectionsView } from "@/lib/billing/loadAdminSectionCollectionsView";
import {
  buildSectionCollectionsCsvArtifact,
  buildSectionCollectionsXlsxArtifact,
} from "@/lib/billing/formatSectionCollectionsExport";
import type { SectionCollectionsExportArtifact } from "@/lib/billing/formatSectionCollectionsExport";
import type { Dictionary, Locale } from "@/types/i18n";
import { logServerException } from "@/lib/logging/serverActionLog";
import { formatProfileNameSurnameFirst } from "@/lib/profile/formatProfileDisplayName";

const COLLECTIONS_BULK_RECIPIENT_LIMIT = 200;

const exportSchema = z.object({
  locale: z.string().min(1),
  sectionId: z.string().uuid(),
  year: z.number().int().min(2000).max(2100),
  format: z.enum(["csv", "xlsx"]),
});

const bulkSchema = z.object({
  locale: z.string().min(1),
  sectionId: z.string().uuid(),
  recipientIds: z
    .array(z.string().uuid())
    .min(1)
    .max(COLLECTIONS_BULK_RECIPIENT_LIMIT),
  bodyHtml: z.string().min(1).max(80000),
});

export type ExportSectionCollectionsResult =
  | { ok: true; artifact: SectionCollectionsExportArtifact }
  | { ok: false; message: string };

export type SendBulkCollectionsMessageResult =
  | {
      ok: true;
      sent: number;
      skipped: string[];
      failed: { id: string; message: string }[];
    }
  | { ok: false; message: string };

function exportLabelsFromDict(
  dict: Dictionary,
): import("@/lib/billing/formatSectionCollectionsExport").SectionCollectionsExportLabels {
  const collections = dict.admin.finance.collections;
  return {
    studentColumn: collections.export.studentColumn,
    documentColumn: collections.export.documentColumn,
    expectedColumn: collections.export.expectedColumn,
    paidColumn: collections.export.paidColumn,
    pendingColumn: collections.export.pendingColumn,
    overdueColumn: collections.export.overdueColumn,
    totalsRowLabel: collections.export.totalsRowLabel,
    monthShortLabels: collections.monthShort,
    outOfPeriodMarker: collections.export.markers.outOfPeriod,
    noPlanMarker: collections.export.markers.noPlan,
    paidMarker: collections.export.markers.paid,
    pendingMarker: collections.export.markers.pending,
    exemptMarker: collections.export.markers.exempt,
    rejectedMarker: collections.export.markers.rejected,
    upcomingMarker: collections.export.markers.upcoming,
    overdueMarker: collections.export.markers.overdue,
  };
}

export async function exportSectionCollectionsAction(input: {
  locale: string;
  sectionId: string;
  year: number;
  format: "csv" | "xlsx";
}): Promise<ExportSectionCollectionsResult> {
  const parsed = exportSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "validation" };
  }
  const { locale, sectionId, year, format } = parsed.data;
  const dict = await getDictionary(locale as Locale);
  const errs = dict.actionErrors.admin;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: errs.forbidden };
  const isAdmin = await resolveIsAdminSession(supabase, user.id);
  if (!isAdmin) return { ok: false, message: errs.forbidden };

  const todayMonth = year === new Date().getFullYear() ? new Date().getMonth() + 1 : 12;
  const view = await loadAdminSectionCollectionsView(supabase, sectionId, {
    todayYear: year,
    todayMonth,
  });
  if (!view) return { ok: false, message: errs.invalidId };

  const labels = exportLabelsFromDict(dict);
  const artifact =
    format === "csv"
      ? buildSectionCollectionsCsvArtifact(view, labels)
      : buildSectionCollectionsXlsxArtifact(view, labels);

  await recordSystemAudit({
    action: "collections_export",
    resourceType: "academic_section",
    resourceId: sectionId,
    payload: {
      year,
      format,
      rows: view.students.length,
    },
  });

  return { ok: true, artifact };
}

export async function sendBulkCollectionsMessageAction(input: {
  locale: string;
  sectionId: string;
  recipientIds: string[];
  bodyHtml: string;
}): Promise<SendBulkCollectionsMessageResult> {
  const parsed = bulkSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "validation" };
  }
  const { locale, sectionId, recipientIds, bodyHtml } = parsed.data;
  const dict = await getDictionary(locale as Locale);
  const msg = dict.actionErrors.messaging;

  const safeHtml = sanitizeMessageHtml(bodyHtml);
  if (stripHtmlToText(safeHtml).length === 0) {
    return { ok: false, message: msg.emptyMessage };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: msg.unauthorized };
  const isAdmin = await resolveIsAdminSession(supabase, user.id);
  if (!isAdmin) return { ok: false, message: msg.forbidden };

  const { data: enrolled } = await supabase
    .from("section_enrollments")
    .select("student_id")
    .eq("section_id", sectionId)
    .eq("status", "active")
    .in("student_id", recipientIds);
  const enrolledIds = new Set(
    ((enrolled ?? []) as { student_id: string }[]).map((r) => r.student_id),
  );
  const validIds = recipientIds.filter((id) => enrolledIds.has(id));
  const skipped = recipientIds.filter((id) => !enrolledIds.has(id));

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", user.id)
    .maybeSingle();
  const senderName =
    formatProfileNameSurnameFirst(profile?.first_name, profile?.last_name) ||
    dict.admin.messages.senderNameFallback;

  const provider = getEmailProvider();
  const settled = await Promise.allSettled(
    validIds.map((rid) =>
      sendStaffMessageUseCase({
        supabase,
        senderId: user.id,
        senderDisplayName: senderName,
        recipientId: rid,
        bodyHtml: safeHtml,
        locale,
        emailProvider: provider,
      }),
    ),
  );

  const failed: { id: string; message: string }[] = [];
  let sent = 0;
  settled.forEach((res, i) => {
    const id = validIds[i];
    if (res.status === "fulfilled") {
      if (res.value.ok) {
        sent += 1;
      } else {
        failed.push({
          id,
          message: mapMessagingUseCaseCode(res.value.message, msg),
        });
      }
    } else {
      logServerException("sendBulkCollectionsMessageAction:loop", res.reason, {
        sectionId,
        recipientId: id,
      });
      failed.push({ id, message: msg.persistFailed });
    }
  });

  await recordSystemAudit({
    action: "collections_bulk_message",
    resourceType: "academic_section",
    resourceId: sectionId,
    payload: { sent, failed: failed.length, skipped: skipped.length },
  });

  revalidatePath(`/${locale}/dashboard/admin/messages`);
  revalidatePath(`/${locale}/dashboard/admin/finance/collections/${sectionId}`);

  return { ok: true, sent, skipped, failed };
}

export const __INTERNAL_COLLECTIONS_BULK_RECIPIENT_LIMIT =
  COLLECTIONS_BULK_RECIPIENT_LIMIT;
