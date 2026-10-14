"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { adminEventsPath, requireAdminEventActor } from "@/app/[locale]/dashboard/admin/events/eventActionsShared";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { sanitizeEmailTemplateHtml } from "@/lib/email/sanitizeEmailTemplateHtml";
import {
  EVENT_EMAIL_LOCALES,
  EVENT_EMAIL_TEMPLATE_KEYS,
  eventEmailAllowsFlow,
  type EventEmailTemplateKey,
} from "@/lib/events/eventEmailCopy";
import { locales } from "@/lib/i18n/dictionaries";
import { logServerException, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { createAdminClient } from "@/lib/supabase/admin";

const saveSchema = z.object({
  eventId: z.string().uuid(),
  templateKey: z.enum(EVENT_EMAIL_TEMPLATE_KEYS),
  locale: z.enum(EVENT_EMAIL_LOCALES),
  flowId: z.string().uuid().nullable(),
  subject: z.string().trim().min(1).max(200),
  bodyHtml: z.string().max(50_000),
});

export type SaveEventEmailTemplateResult =
  | { ok: true }
  | { ok: false; message: "forbidden" | "validation_failed" | "invalid_html" | "save_failed" };

export async function saveEventEmailTemplateAction(
  input: z.infer<typeof saveSchema>,
): Promise<SaveEventEmailTemplateResult> {
  const actorId = await requireAdminEventActor();
  if (!actorId) return { ok: false, message: "forbidden" };

  const parsed = saveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "validation_failed" };
  const { eventId, templateKey, locale, subject } = parsed.data;
  const flowId = parsed.data.flowId;
  if (flowId && !eventEmailAllowsFlow(templateKey)) {
    return { ok: false, message: "validation_failed" };
  }

  const bodyHtml = sanitizeEmailTemplateHtml(parsed.data.bodyHtml).trim();
  if (!bodyHtml) return { ok: false, message: "invalid_html" };

  try {
    const admin = createAdminClient();
    if (flowId) {
      const flow = await admin
        .from("event_registration_flows")
        .select("id")
        .eq("id", flowId)
        .eq("event_id", eventId)
        .maybeSingle();
      if (flow.error || !flow.data?.id) return { ok: false, message: "validation_failed" };
    }

    const saved = await upsertEventEmailCopy(admin, {
      eventId,
      templateKey,
      locale,
      flowId,
      subject,
      bodyHtml,
      actorId,
    });
    if (!saved) return { ok: false, message: "save_failed" };

    await recordSystemAudit({
      action: "event_email_template_saved",
      resourceType: "event_email_template",
      resourceId: eventId,
      payload: { template_key: templateKey, locale, flow_id: flowId },
    });
    for (const loc of locales) {
      revalidatePath(`${adminEventsPath(loc)}/${eventId}`, "page");
    }
    return { ok: true };
  } catch (error) {
    logServerException("saveEventEmailTemplateAction", error, { eventId, templateKey });
    return { ok: false, message: "save_failed" };
  }
}

async function upsertEventEmailCopy(
  admin: ReturnType<typeof createAdminClient>,
  row: {
    eventId: string;
    templateKey: EventEmailTemplateKey;
    locale: string;
    flowId: string | null;
    subject: string;
    bodyHtml: string;
    actorId: string;
  },
): Promise<boolean> {
  let lookup = admin
    .from("event_email_templates")
    .select("id")
    .eq("event_id", row.eventId)
    .eq("template_key", row.templateKey)
    .eq("locale", row.locale);
  lookup = row.flowId ? lookup.eq("flow_id", row.flowId) : lookup.is("flow_id", null);
  const existing = await lookup.maybeSingle();
  if (existing.error) {
    logSupabaseClientError("saveEventEmailTemplateAction:lookup", existing.error, {
      eventId: row.eventId,
      templateKey: row.templateKey,
    });
    return false;
  }

  const payload = {
    subject: row.subject,
    body_html: row.bodyHtml,
    updated_at: new Date().toISOString(),
    updated_by: row.actorId,
  };
  const write = existing.data?.id
    ? await admin.from("event_email_templates").update(payload).eq("id", existing.data.id)
    : await admin.from("event_email_templates").insert({
        ...payload,
        event_id: row.eventId,
        flow_id: row.flowId,
        template_key: row.templateKey,
        locale: row.locale,
      });
  if (write.error) {
    logSupabaseClientError("saveEventEmailTemplateAction:write", write.error, {
      eventId: row.eventId,
      templateKey: row.templateKey,
    });
    return false;
  }
  return true;
}
