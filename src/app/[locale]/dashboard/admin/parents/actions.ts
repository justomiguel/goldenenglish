"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveIsAdminSession } from "@/lib/auth/resolveIsAdminSession";
import { getEmailProvider } from "@/lib/email/getEmailProvider";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getPublicSiteUrl } from "@/lib/site/publicUrl";
import { loadEmailTemplate } from "@/lib/email/templates/loadEmailTemplate";
import { inviteParentsToPlatform } from "@/lib/email/inviteParentsToPlatform";
import { sendParentBulkCommunication } from "@/lib/messaging/useCases/sendParentBulkCommunication";
import { resolveParentRecipients } from "@/lib/dashboard/resolveParentRecipients";
import { parseParentRecipientScope } from "@/lib/parents/parseParentRecipientScope";
import { sanitizeMessageHtml } from "@/lib/messaging/sanitizeMessageHtml";
import { stripHtmlToText } from "@/lib/messaging/stripHtml";
import type { Locale } from "@/types/i18n";
import type { ParentMailMode } from "@/lib/parents/parentRecipient";

function asLocale(value: string): Locale {
  if (value === "en" || value === "pt") return value;
  return "es";
}

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, code: "unauthorized" as const };
  const allowed = await resolveIsAdminSession(supabase, user.id);
  if (!allowed) return { ok: false as const, code: "forbidden" as const };
  return { ok: true as const, supabase, userId: user.id };
}

export async function inviteParentsAction(
  locale: string,
  rawScope: Record<string, string | string[] | undefined>,
): Promise<{ ok: boolean; message: string }> {
  const dict = await getDictionary(locale);
  const labels = dict.admin.parents;
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false, message: dict.actionErrors.messaging.unauthorized };
  const admin = createAdminClient();
  const parents = await resolveParentRecipients(admin, parseParentRecipientScope(rawScope));
  if (parents.length === 0) return { ok: false, message: labels.resultEmpty };
  const origin = getPublicSiteUrl()?.origin ?? "http://localhost:3000";
  const loc = asLocale(locale);
  const result = await inviteParentsToPlatform({
    supabase: gate.supabase,
    senderId: gate.userId,
    parents,
    portalUrl: `${origin}/${loc}/login`,
    generateRecoveryLink: async (email) => {
      const { data } = await admin.auth.admin.generateLink({
        type: "recovery",
        email,
        options: { redirectTo: `${origin}/${loc}/reset-password` },
      });
      return data.properties?.action_link ?? null;
    },
    renderInvite: async (vars) => {
      const tpl = await loadEmailTemplate({
        key: "notifications.parent_platform_invite",
        locale: loc,
        vars,
      });
      if (!tpl) return null;
      return { subject: tpl.subject, bodyHtml: tpl.bodyHtml };
    },
    sendInviteEmail: async (to, subject, html) => {
      const r = await getEmailProvider().sendEmail({ to, subject, html });
      return { ok: r.ok };
    },
  });
  void recordSystemAudit({
    action: "parents_invited",
    resourceType: "profile",
    resourceId: gate.userId,
    payload: { count: parents.length, emailed: result.emailed },
  });
  revalidatePath(`/${locale}/dashboard/admin/parents`);
  return {
    ok: true,
    message: labels.resultOk
      .replace("{{portal}}", String(result.portalOk))
      .replace("{{emailed}}", String(result.emailed))
      .replace("{{skipped}}", String(result.skippedSynthetic))
      .replace("{{failed}}", String(result.failed)),
  };
}

export async function sendParentBulkMailAction(
  locale: string,
  rawScope: Record<string, string | string[] | undefined>,
  input: { subject: string; html: string; mode: ParentMailMode },
): Promise<{ ok: boolean; message: string }> {
  const dict = await getDictionary(locale);
  const labels = dict.admin.parents;
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false, message: dict.actionErrors.messaging.unauthorized };
  const subject = input.subject.trim();
  const safeHtml = sanitizeMessageHtml(input.html);
  if (!subject || stripHtmlToText(safeHtml).length === 0) {
    return { ok: false, message: labels.resultInvalid };
  }
  const admin = createAdminClient();
  const parents = await resolveParentRecipients(admin, parseParentRecipientScope(rawScope));
  if (parents.length === 0) return { ok: false, message: labels.resultEmpty };
  const fromAddress = process.env.RESEND_FROM_EMAIL?.trim() || "noreply@localhost";
  const result = await sendParentBulkCommunication({
    supabase: gate.supabase,
    senderId: gate.userId,
    parents,
    mode: input.mode,
    subject,
    html: safeHtml,
    fromAddress,
    emailProvider: getEmailProvider(),
  });
  void recordSystemAudit({
    action: "parents_bulk_mail",
    resourceType: "profile",
    resourceId: gate.userId,
    payload: { mode: input.mode, count: parents.length, emailed: result.emailed },
  });
  revalidatePath(`/${locale}/dashboard/admin/parents`);
  revalidatePath(`/${locale}/dashboard/admin/messages`);
  return {
    ok: true,
    message: labels.resultOk
      .replace("{{portal}}", String(result.portalOk))
      .replace("{{emailed}}", String(result.emailed))
      .replace("{{skipped}}", String(result.skippedSynthetic))
      .replace("{{failed}}", String(result.failed)),
  };
}
