import "server-only";

import { loadEmailTemplate } from "@/lib/email/templates/loadEmailTemplate";
import {
  applyEventEmailVars,
  escapeEventEmailVars,
  parseEventEmailLocale,
  pickEventEmailCopy,
  type EventEmailCopyRow,
  type EventEmailTemplateKey,
} from "@/lib/events/eventEmailCopy";
import { logServerException, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { createAdminClient } from "@/lib/supabase/admin";

export interface ResolvedEventEmail {
  subject: string;
  bodyHtml: string;
  fromOverride: boolean;
}

export async function loadResolvedEventEmail(input: {
  eventId: string;
  templateKey: EventEmailTemplateKey;
  locale: string;
  flowId?: string | null;
  vars?: Record<string, string>;
}): Promise<ResolvedEventEmail | null> {
  const locale = parseEventEmailLocale(input.locale);
  const vars = input.vars ?? {};
  const rows = await loadEventEmailRows(input.eventId, input.templateKey, locale);
  const picked = pickEventEmailCopy(rows, {
    templateKey: input.templateKey,
    locale,
    flowId: input.flowId,
  });
  if (picked) {
    return { ...applyEventEmailVars(picked, vars), fromOverride: true };
  }

  const institute = await loadEmailTemplate({
    key: input.templateKey,
    locale,
    vars: escapeEventEmailVars(vars),
  });
  if (!institute) return null;
  return {
    subject: institute.subject,
    bodyHtml: institute.bodyHtml,
    fromOverride: institute.fromOverride,
  };
}

async function loadEventEmailRows(
  eventId: string,
  templateKey: EventEmailTemplateKey,
  locale: string,
): Promise<EventEmailCopyRow[]> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("event_email_templates")
      .select("template_key, locale, flow_id, subject, body_html")
      .eq("event_id", eventId)
      .eq("template_key", templateKey)
      .eq("locale", locale);
    if (error) {
      logSupabaseClientError("loadResolvedEventEmail:select", error, { eventId, templateKey });
      return [];
    }
    return (data ?? []).map((row) => ({
      templateKey,
      locale,
      flowId: row.flow_id ? String(row.flow_id) : null,
      subject: String(row.subject ?? ""),
      bodyHtml: String(row.body_html ?? ""),
    }));
  } catch (error) {
    logServerException("loadResolvedEventEmail:select", error, { eventId, templateKey });
    return [];
  }
}
