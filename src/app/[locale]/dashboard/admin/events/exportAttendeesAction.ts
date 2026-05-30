"use server";

import { z } from "zod";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveIsAdminSession } from "@/lib/auth/resolveIsAdminSession";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { loadReceiptBrandForRequest } from "@/lib/billing/loadReceiptBrandForRequest";
import { loadEventAttendeeCustomFieldValues } from "@/lib/dashboard/events/loadEventAttendeeCustomFieldValues";
import {
  loadEventAttendeesForExport,
  loadEventFormFieldColumnsForExport,
} from "@/lib/dashboard/events/loadEventAttendeesForExport";
import { buildEventAttendeesExportTable } from "@/lib/events/export/buildEventAttendeesExportTable";
import { buildEventAttendeesXlsxArtifact } from "@/lib/events/export/buildEventAttendeesXlsxArtifact";
import { buildEventAttendeesPdfArtifact } from "@/lib/events/export/buildEventAttendeesPdfArtifact";
import { resolveEventCoverImageUrl } from "@/lib/rich-content/resolvePublicContentCoverUrl";
import { ensureAbsolutePublicUrl } from "@/lib/site/ensureAbsolutePublicUrl";
import { getPublicSiteUrl } from "@/lib/site/publicUrl";
import type { EventAttendeesExportArtifact } from "@/lib/events/export/eventAttendeesExportTypes";
import type { Dictionary, Locale } from "@/types/i18n";
import { logServerException, logSupabaseClientError } from "@/lib/logging/serverActionLog";

const exportSchema = z.object({
  locale: z.string().min(1),
  eventId: z.string().uuid(),
  format: z.enum(["xlsx", "pdf"]),
});

export type ExportEventAttendeesResult =
  | { ok: true; artifact: EventAttendeesExportArtifact }
  | { ok: false; message: string };

function columnLabelsFromDict(dict: Dictionary) {
  const detail = dict.admin.events.detail;
  const columns = detail.attendeesColumns;
  return {
    name: columns.name,
    dni: columns.dni,
    email: columns.email,
    phone: columns.phone,
    birthDate: columns.birthDate,
    status: columns.status,
    payment: columns.payment,
    residency: columns.residency,
    source: columns.source,
    registered: columns.registered,
    tutorName: columns.name,
    tutorDni: columns.dni,
    tutorEmail: columns.email,
    tutorPhone: columns.phone,
    tutorRelationship: detail.attendeesExport.tutorRelationship,
    statusLabels: detail.attendeesStatusLabels,
    paymentLabels: {
      pending: dict.admin.finance.events.pendingLabel,
      approved: dict.admin.finance.events.approvedLabel,
      rejected: dict.admin.finance.events.rejectedLabel,
    },
    residencyLabels: detail.attendeesResidencyLabels,
    sourceLabels: detail.attendeesSourceLabels,
    noPhone: detail.attendeesNoPhone,
    noBirthDate: detail.attendeesNoBirthDate,
    noPayment: detail.attendeesNoPayment,
    emptyValue: detail.attendeesExport.emptyValue,
  };
}

function metaLabelsFromDict(dict: Dictionary) {
  const exportDict = dict.admin.events.detail.attendeesExport;
  return {
    documentTitle: exportDict.documentTitle,
    eventDate: dict.admin.events.detail.eventDate,
    exportedAt: exportDict.exportedAt,
    attendeeCount: exportDict.attendeeCount,
    sheetName: exportDict.sheetName,
  };
}

export async function exportEventAttendeesAction(input: {
  locale: string;
  eventId: string;
  format: "xlsx" | "pdf";
}): Promise<ExportEventAttendeesResult> {
  const parsed = exportSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "validation" };
  }

  const { locale, eventId, format } = parsed.data;
  const dict = await getDictionary(locale as Locale);
  const errs = dict.actionErrors.admin;
  const exportDict = dict.admin.events.detail.attendeesExport;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, message: errs.forbidden };
    const isAdmin = await resolveIsAdminSession(supabase, user.id);
    if (!isAdmin) return { ok: false, message: errs.forbidden };

    const admin = createAdminClient();
    const { data: event, error: eventError } = await admin
      .from("events")
      .select("id, title, description, event_date, location, slug")
      .eq("id", eventId)
      .maybeSingle();

    if (eventError) {
      logSupabaseClientError("exportEventAttendeesAction.loadEvent", eventError, { eventId });
      return { ok: false, message: exportDict.exportError };
    }
    if (!event) return { ok: false, message: errs.invalidId };

    const { attendees, truncated } = await loadEventAttendeesForExport(admin, eventId);
    if (attendees.length === 0) {
      return { ok: false, message: exportDict.exportEmpty };
    }

    const [customColumns, customFieldValues, brand] = await Promise.all([
      loadEventFormFieldColumnsForExport(admin, eventId, locale),
      loadEventAttendeeCustomFieldValues(
        admin,
        attendees.map((row) => row.id),
        locale,
      ),
      loadReceiptBrandForRequest(),
    ]);

    const columnLabels = columnLabelsFromDict(dict);
    const table = buildEventAttendeesExportTable({
      attendees,
      customColumns,
      customFieldValues,
      locale,
      labels: columnLabels,
    });

    const exportedAt = new Date();
    const exportedAtFormatted = exportedAt.toLocaleString(locale);
    const eventDateFormatted = new Date(String(event.event_date)).toLocaleString(locale);
    const siteOrigin = getPublicSiteUrl()?.origin ?? "http://localhost:3000";
    const coverRelative = resolveEventCoverImageUrl(String(event.description ?? ""));
    const coverImageUrl = coverRelative ? ensureAbsolutePublicUrl(coverRelative, siteOrigin) : null;

    const artifactInput = {
      eventSlug: String(event.slug ?? event.title ?? eventId),
      brand: {
        instituteName: brand.name,
        legalName: brand.legalName,
        legalRegistry: brand.legalRegistry,
        logoUrl: brand.logoUrl,
        primaryColor: brand.primaryColor,
        contactEmail: brand.contactEmail,
        contactPhone: brand.contactPhone,
        contactAddress: brand.contactAddress,
      },
      event: {
        title: String(event.title),
        eventDateFormatted,
        coverImageUrl,
        location: event.location ? String(event.location) : null,
      },
      meta: metaLabelsFromDict(dict),
      table,
      attendeeCount: attendees.length,
      exportedAtFormatted,
    };

    const artifact =
      format === "xlsx"
        ? buildEventAttendeesXlsxArtifact(artifactInput)
        : await buildEventAttendeesPdfArtifact(artifactInput);

    await recordSystemAudit({
      action: "event_attendees_export",
      resourceType: "event",
      resourceId: eventId,
      payload: {
        format,
        rowCount: attendees.length,
        truncated,
      },
    });

    return { ok: true, artifact };
  } catch (error) {
    logServerException("exportEventAttendeesAction", error, { eventId, format });
    return { ok: false, message: exportDict.exportError };
  }
}
