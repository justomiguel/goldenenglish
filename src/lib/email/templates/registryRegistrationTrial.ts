import type { EmailTemplateDefinition } from "@/types/emailTemplates";
import { withPtFallback } from "@/lib/email/templates/withPtEmailDefaults";
import { REGISTRATION_ADMIN_PLACEHOLDERS } from "@/lib/email/templates/registryRegistrationAdmin";

const FAMILY_PLACEHOLDERS = [
  { name: "greetingName", description: "Nombre del destinatario", sample: "María" },
  { name: "studentName", description: "Nombre del alumno", sample: "Juan Pérez" },
  { name: "sectionName", description: "Sección", sample: "A2 Mañana" },
  { name: "scheduleLabel", description: "Horario de la visita", sample: "Lun 18:00" },
  { name: "payBlock", description: "CTA (unirse / reprogramar) o vacío", sample: "" },
];

export const REGISTRATION_TRIAL_EMAIL_KEYS = [
  "registration.admin_trial_attendance_due",
  "registration.trial_missed",
  "registration.trial_invite",
  "registration.trial_rescheduled",
  "registration.trial_added",
  "registration.admin_trial_enrolled",
] as const;

export const adminTrialAttendanceDueTemplate: EmailTemplateDefinition = {
  key: "registration.admin_trial_attendance_due",
  category: "notifications",
  label: {
    es: "Clase de prueba: marcar asistencia (admin)",
    en: "Trial class: mark attendance (admin)",
  },
  description: {
    es: "Aviso 1 h antes: revisar si el visitante llegó y marcar presente o ausente.",
    en: "1 hour before: check whether the visitor arrived and mark present or absent.",
  },
  placeholders: REGISTRATION_ADMIN_PLACEHOLDERS,
  defaults: withPtFallback({
    es: {
      subject: "Clase de prueba en 1 h · {{studentName}}",
      bodyHtml: `<p style="margin:0 0 12px;">{{studentName}} tiene clase de prueba en <strong>{{sectionName}}</strong> ({{scheduleLabel}}).</p>
<p style="margin:0 0 12px;">Revisá si llegó y marcá presente o ausente en la preinscripción o en la asistencia del horario.</p>
<p style="margin:0;"><a href="{{adminUrl}}">Abrir preinscripciones</a></p>`,
    },
    en: {
      subject: "Trial class in 1 hour · {{studentName}}",
      bodyHtml: `<p style="margin:0 0 12px;">{{studentName}} has a trial class in <strong>{{sectionName}}</strong> ({{scheduleLabel}}).</p>
<p style="margin:0 0 12px;">Check whether they arrived and mark present or absent in the inbox or the section attendance page.</p>
<p style="margin:0;"><a href="{{adminUrl}}">Open pre-registrations</a></p>`,
    },
  }),
};

export const trialMissedTemplate: EmailTemplateDefinition = {
  key: "registration.trial_missed",
  category: "notifications",
  label: { es: "Clase de prueba: te extrañamos", en: "Trial class: we missed you" },
  description: {
    es: "No-show o marca ausente. Incluye el botón para reprogramar.",
    en: "No-show or marked absent. Includes the reschedule button.",
  },
  placeholders: FAMILY_PLACEHOLDERS,
  defaults: withPtFallback({
    es: {
      subject: "Te extrañamos en la clase de prueba",
      bodyHtml: `<p style="margin:0 0 12px;">Hola {{greetingName}},</p>
<p style="margin:0 0 12px;">No vimos a <strong>{{studentName}}</strong> en <strong>{{sectionName}}</strong> ({{scheduleLabel}}).</p>
<p style="margin:0 0 12px;">Si quieren, pueden agendar otra fecha:</p>
{{payBlock}}`,
    },
    en: {
      subject: "We missed you at the trial class",
      bodyHtml: `<p style="margin:0 0 12px;">Hi {{greetingName}},</p>
<p style="margin:0 0 12px;">We did not see <strong>{{studentName}}</strong> in <strong>{{sectionName}}</strong> ({{scheduleLabel}}).</p>
<p style="margin:0 0 12px;">You can book another date if you still want to come:</p>
{{payBlock}}`,
    },
  }),
};

export const trialInviteTemplate: EmailTemplateDefinition = {
  key: "registration.trial_invite",
  category: "notifications",
  label: { es: "Clase de prueba: sumate", en: "Trial class: join us" },
  description: {
    es: "Tras marcar presente: enlace de 3 meses para unirse (matrícula o cuota del mes).",
    en: "After present: 3-month link to join (enrollment fee or this month’s tuition).",
  },
  placeholders: FAMILY_PLACEHOLDERS,
  defaults: withPtFallback({
    es: {
      subject: "¿{{studentName}} se suma?",
      bodyHtml: `<p style="margin:0 0 12px;">Hola {{greetingName}},</p>
<p style="margin:0 0 12px;"><strong>{{studentName}}</strong> vino a la clase de prueba en <strong>{{sectionName}}</strong> ({{scheduleLabel}}).</p>
<p style="margin:0 0 12px;">Este enlace vale 3 meses para confirmar el cupo:</p>
{{payBlock}}`,
    },
    en: {
      subject: "Want {{studentName}} to join?",
      bodyHtml: `<p style="margin:0 0 12px;">Hi {{greetingName}},</p>
<p style="margin:0 0 12px;"><strong>{{studentName}}</strong> came to the trial class in <strong>{{sectionName}}</strong> ({{scheduleLabel}}).</p>
<p style="margin:0 0 12px;">This link is valid for 3 months to confirm the seat:</p>
{{payBlock}}`,
    },
  }),
};

export const trialRescheduledTemplate: EmailTemplateDefinition = {
  key: "registration.trial_rescheduled",
  category: "notifications",
  label: { es: "Clase de prueba: nueva fecha", en: "Trial class: new date" },
  description: {
    es: "Confirma el nuevo horario de la clase de prueba.",
    en: "Confirms the new trial-class schedule.",
  },
  placeholders: FAMILY_PLACEHOLDERS,
  defaults: withPtFallback({
    es: {
      subject: "Reprogramamos la clase de prueba de {{studentName}}",
      bodyHtml: `<p style="margin:0 0 12px;">Hola {{greetingName}},</p>
<p style="margin:0 0 12px;">Agendamos otra fecha para <strong>{{studentName}}</strong> en <strong>{{sectionName}}</strong> ({{scheduleLabel}}).</p>
{{payBlock}}`,
    },
    en: {
      subject: "We booked another trial class for {{studentName}}",
      bodyHtml: `<p style="margin:0 0 12px;">Hi {{greetingName}},</p>
<p style="margin:0 0 12px;">We booked another date for <strong>{{studentName}}</strong> in <strong>{{sectionName}}</strong> ({{scheduleLabel}}).</p>
{{payBlock}}`,
    },
  }),
};

export const trialAddedTemplate: EmailTemplateDefinition = {
  key: "registration.trial_added",
  category: "notifications",
  label: { es: "Clase de prueba: te sumamos", en: "Trial class: we added you" },
  description: {
    es: "Alumno existente que se suma a un horario después de la clase de prueba.",
    en: "Existing student added to a schedule after the trial class.",
  },
  placeholders: FAMILY_PLACEHOLDERS,
  defaults: withPtFallback({
    es: {
      subject: "Sumamos a {{studentName}} a {{sectionName}}",
      bodyHtml: `<p style="margin:0 0 12px;">Hola {{greetingName}},</p>
<p style="margin:0 0 12px;">{{studentName}} ya está en <strong>{{sectionName}}</strong> ({{scheduleLabel}}).</p>`,
    },
    en: {
      subject: "{{studentName}} joined {{sectionName}}",
      bodyHtml: `<p style="margin:0 0 12px;">Hi {{greetingName}},</p>
<p style="margin:0 0 12px;">{{studentName}} is now in <strong>{{sectionName}}</strong> ({{scheduleLabel}}).</p>`,
    },
  }),
};

export const adminTrialEnrolledTemplate: EmailTemplateDefinition = {
  key: "registration.admin_trial_enrolled",
  category: "notifications",
  label: {
    es: "Clase de prueba: inscripto (admin)",
    en: "Trial class: enrolled (admin)",
  },
  description: {
    es: "Aviso admin cuando un lead de prueba se convierte en alumno.",
    en: "Admin notice when a trial lead becomes a student.",
  },
  placeholders: REGISTRATION_ADMIN_PLACEHOLDERS,
  defaults: withPtFallback({
    es: {
      subject: "Vino de clase de prueba · {{studentName}}",
      bodyHtml: `<p style="margin:0 0 12px;">{{studentName}} se sumó después de la clase de prueba.</p>
<p style="margin:0 0 8px;">Sección: {{sectionName}} ({{scheduleLabel}})</p>
<p style="margin:0;"><a href="{{adminUrl}}">Abrir preinscripciones</a></p>`,
    },
    en: {
      subject: "Joined after a trial class · {{studentName}}",
      bodyHtml: `<p style="margin:0 0 12px;">{{studentName}} joined after the trial class.</p>
<p style="margin:0 0 8px;">Section: {{sectionName}} ({{scheduleLabel}})</p>
<p style="margin:0;"><a href="{{adminUrl}}">Open pre-registrations</a></p>`,
    },
  }),
};

export const REGISTRATION_TRIAL_EMAIL_TEMPLATES: ReadonlyArray<EmailTemplateDefinition> = [
  adminTrialAttendanceDueTemplate,
  trialMissedTemplate,
  trialInviteTemplate,
  trialRescheduledTemplate,
  trialAddedTemplate,
  adminTrialEnrolledTemplate,
];
