import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmailProvider } from "@/lib/email/getEmailProvider";
import { logServerException } from "@/lib/logging/serverActionLog";
import type { Locale } from "@/types/i18n";

type EventNotificationTemplateKey =
  | "events.registered"
  | "events.payment_approved"
  | "events.payment_rejected"
  | "events.reminder";

const FALLBACKS: Record<EventNotificationTemplateKey, Record<Locale, { subject: string; body: string }>> = {
  "events.registered": {
    es: { subject: "Inscripción recibida", body: "<p>Tu inscripción al evento fue recibida correctamente.</p>" },
    en: { subject: "Registration received", body: "<p>Your event registration was received successfully.</p>" },
    pt: { subject: "Inscrição recebida", body: "<p>Sua inscrição no evento foi recebida com sucesso.</p>" },
  },
  "events.payment_approved": {
    es: { subject: "Pago aprobado", body: "<p>Tu pago del evento fue aprobado.</p>" },
    en: { subject: "Payment approved", body: "<p>Your event payment was approved.</p>" },
    pt: { subject: "Pagamento aprovado", body: "<p>Seu pagamento do evento foi aprovado.</p>" },
  },
  "events.payment_rejected": {
    es: { subject: "Pago rechazado", body: "<p>No pudimos aprobar tu pago del evento.</p>" },
    en: { subject: "Payment rejected", body: "<p>We could not approve your event payment.</p>" },
    pt: { subject: "Pagamento rejeitado", body: "<p>Não foi possível aprovar seu pagamento do evento.</p>" },
  },
  "events.reminder": {
    es: { subject: "Recordatorio de evento", body: "<p>Tu evento comienza pronto.</p>" },
    en: { subject: "Event reminder", body: "<p>Your event starts soon.</p>" },
    pt: { subject: "Lembrete de evento", body: "<p>Seu evento começa em breve.</p>" },
  },
};

async function resolveTemplate(
  key: EventNotificationTemplateKey,
  locale: Locale,
): Promise<{ subject: string; body: string }> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("email_templates")
    .select("subject, body_html")
    .eq("template_key", key)
    .eq("locale", locale)
    .maybeSingle();

  if (!data?.subject || !data?.body_html) return FALLBACKS[key][locale];
  return { subject: String(data.subject), body: String(data.body_html) };
}

export async function notifyAttendeeViaResend(input: {
  to: string;
  templateKey: EventNotificationTemplateKey;
  locale: Locale;
}): Promise<boolean> {
  try {
    const template = await resolveTemplate(input.templateKey, input.locale);
    const provider = getEmailProvider();
    const result = await provider.sendEmail({
      to: input.to,
      subject: template.subject,
      html: template.body,
    });
    return result.ok;
  } catch (error) {
    logServerException("notifyAttendeeViaResend", error);
    return false;
  }
}
