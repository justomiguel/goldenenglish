import type { SupabaseClient } from "@supabase/supabase-js";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { sanitizeMessageHtml } from "@/lib/messaging/sanitizeMessageHtml";
import type { ParentRecipient } from "@/lib/parents/parentRecipient";

export type InviteParentsResult = {
  portalOk: number;
  emailed: number;
  skippedSynthetic: number;
  failed: number;
  persistFailed: number;
};

export type InviteParentRow = ParentRecipient & { authEmail: string | null };

export async function inviteParentsToPlatform(input: {
  supabase: SupabaseClient;
  senderId: string;
  parents: InviteParentRow[];
  portalUrl: string;
  generateRecoveryLink: (email: string) => Promise<string | null>;
  renderInvite: (vars: {
    nombre: string;
    apellido: string;
    greetingName: string;
    portalUrl: string;
    resetUrl: string;
  }) => Promise<{ subject: string; bodyHtml: string } | null>;
  sendInviteEmail: (
    to: string,
    vars: {
      nombre: string;
      apellido: string;
      greetingName: string;
      portalUrl: string;
      resetUrl: string;
    },
  ) => Promise<{ ok: boolean }>;
}): Promise<InviteParentsResult> {
  let portalOk = 0;
  let emailed = 0;
  let skippedSynthetic = 0;
  let failed = 0;
  let persistFailed = 0;

  for (const parent of input.parents) {
    const authEmail = parent.authEmail?.trim() || parent.email;
    const resetUrl = authEmail ? ((await input.generateRecoveryLink(authEmail)) ?? "") : "";
    const inviteVars = {
      nombre: parent.firstName,
      apellido: parent.lastName,
      greetingName: parent.firstName || parent.lastName,
      portalUrl: input.portalUrl,
      resetUrl,
    };
    const rendered = await input.renderInvite(inviteVars);
    const bodyHtml = sanitizeMessageHtml(rendered?.bodyHtml ?? `<p><a href="${input.portalUrl}">portal</a></p>`);
    const { error } = await input.supabase.from("portal_messages").insert({
      sender_id: input.senderId,
      recipient_id: parent.id,
      body_html: bodyHtml,
    });
    if (error) {
      logSupabaseClientError("inviteParentsToPlatform:insert", error, { parentId: parent.id });
      persistFailed += 1;
      continue;
    }
    portalOk += 1;
    if (!parent.email) {
      skippedSynthetic += 1;
      continue;
    }
    if (!rendered) {
      skippedSynthetic += 1;
      continue;
    }
    const sent = await input.sendInviteEmail(parent.email, inviteVars);
    if (sent.ok) emailed += 1;
    else failed += 1;
  }

  return { portalOk, emailed, skippedSynthetic, failed, persistFailed };
}
