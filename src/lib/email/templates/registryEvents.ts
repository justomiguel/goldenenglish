import type { EmailTemplateDefinition } from "@/types/emailTemplates";
import { withPtFallback } from "@/lib/email/templates/withPtEmailDefaults";

export const EVENTS_EMAIL_KEYS = [
  "events.registered",
  "events.payment_approved",
  "events.payment_rejected",
  "events.reminder",
] as const;

export type EventsEmailKey = (typeof EVENTS_EMAIL_KEYS)[number];

export const eventsRegisteredTemplate: EmailTemplateDefinition = {
  key: "events.registered",
  category: "notifications",
  label: { es: "Eventos: inscripción recibida", en: "Events: registration received" },
  description: {
    es: "Confirma al asistente que su inscripción al evento llegó.",
    en: "Confirms the attendee that their event registration was received.",
  },
  placeholders: [],
  defaults: withPtFallback({
    es: {
      subject: "Inscripción recibida",
      bodyHtml: "<p>Tu inscripción al evento fue recibida correctamente.</p>",
    },
    en: {
      subject: "Registration received",
      bodyHtml: "<p>Your event registration was received successfully.</p>",
    },
  }),
};

export const eventsPaymentApprovedTemplate: EmailTemplateDefinition = {
  key: "events.payment_approved",
  category: "notifications",
  label: { es: "Eventos: pago aprobado", en: "Events: payment approved" },
  description: {
    es: "Avisa que el pago del evento fue aprobado.",
    en: "Tells the attendee their event payment was approved.",
  },
  placeholders: [],
  defaults: withPtFallback({
    es: {
      subject: "Pago aprobado",
      bodyHtml: "<p>Tu pago del evento fue aprobado. ¡Nos vemos pronto!</p>",
    },
    en: {
      subject: "Payment approved",
      bodyHtml: "<p>Your event payment was approved. See you soon!</p>",
    },
  }),
};

export const eventsPaymentRejectedTemplate: EmailTemplateDefinition = {
  key: "events.payment_rejected",
  category: "notifications",
  label: { es: "Eventos: pago rechazado", en: "Events: payment rejected" },
  description: {
    es: "Avisa que no se pudo aprobar el pago del evento.",
    en: "Tells the attendee the event payment could not be approved.",
  },
  placeholders: [],
  defaults: withPtFallback({
    es: {
      subject: "Pago rechazado",
      bodyHtml:
        "<p>No pudimos aprobar tu pago del evento. Revisa el comprobante e inténtalo nuevamente.</p>",
    },
    en: {
      subject: "Payment rejected",
      bodyHtml:
        "<p>We could not approve your event payment. Please review the receipt and try again.</p>",
    },
  }),
};

export const eventsReminderTemplate: EmailTemplateDefinition = {
  key: "events.reminder",
  category: "notifications",
  label: { es: "Eventos: recordatorio", en: "Events: reminder" },
  description: {
    es: "Recordatorio de que el evento está por comenzar.",
    en: "Reminder that the event is about to start.",
  },
  placeholders: [],
  defaults: withPtFallback({
    es: {
      subject: "Recordatorio de evento",
      bodyHtml: "<p>Te recordamos que tu evento está próximo a comenzar.</p>",
    },
    en: {
      subject: "Event reminder",
      bodyHtml: "<p>This is a reminder that your event is starting soon.</p>",
    },
  }),
};

export const EVENTS_EMAIL_TEMPLATES: ReadonlyArray<EmailTemplateDefinition> = [
  eventsRegisteredTemplate,
  eventsPaymentApprovedTemplate,
  eventsPaymentRejectedTemplate,
  eventsReminderTemplate,
];
