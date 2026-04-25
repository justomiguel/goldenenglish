import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { EmailProvider } from "@/lib/email/emailProvider";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { sanitizeMessageHtml } from "@/lib/messaging/sanitizeMessageHtml";
import { sendStaffMessageUseCase } from "@/lib/messaging/useCases/sendStaffMessage";
import { logServerException } from "@/lib/logging/serverActionLog";
import type { Locale } from "@/types/i18n";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Aviso en portal a tutor/alumno/padre: el equipo intentó un contacto de retención
 * (WhatsApp o correo) por señales de faltas/promedio.
 */
export async function notifyRetentionOutreachInApp(input: {
  supabase: SupabaseClient;
  adminUserId: string;
  adminDisplayName: string;
  /** Tutor, alumno en contacto propio, etc. (perfil con portal). */
  recipientUserId: string;
  studentLabel: string;
  sectionName: string;
  locale: string;
  channel: "whatsapp" | "email";
  emailProvider: EmailProvider;
}): Promise<void> {
  if (input.recipientUserId === input.adminUserId) return;

  const loc = (input.locale === "en" ? "en" : "es") as Locale;
  const dict = await getDictionary(loc);
  const keys = dict.dashboard.adminRetention;
  const raw =
    input.channel === "whatsapp" ? keys.outreachInAppWhatsapp : keys.outreachInAppEmail;
  const withNames = raw
    .replaceAll("{student}", escapeHtml(input.studentLabel))
    .replaceAll("{section}", escapeHtml(input.sectionName));
  const bodyHtml = sanitizeMessageHtml(withNames);
  if (!bodyHtml.trim()) {
    return;
  }

  const r = await sendStaffMessageUseCase({
    supabase: input.supabase,
    senderId: input.adminUserId,
    senderDisplayName: input.adminDisplayName,
    recipientId: input.recipientUserId,
    bodyHtml,
    locale: input.locale,
    emailProvider: input.emailProvider,
  });
  if (!r.ok) {
    logServerException("notifyRetentionOutreachInApp", new Error("staff_message_failed"), {
      recipientId: input.recipientUserId,
    });
  }
}
