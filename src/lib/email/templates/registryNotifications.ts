import type { EmailTemplateDefinition } from "@/types/emailTemplates";

export const churnInactivityTemplate: EmailTemplateDefinition = {
  key: "churn.inactivity",
  category: "churn",
  label: { es: "Retención: te extrañamos en el portal", en: "Retention: we miss you on the portal" },
  description: {
    es: "Email de reactivación a tutores cuando el alumno deja de entrar al portal.",
    en: "Reactivation email to tutors when the student stops opening the portal.",
  },
  placeholders: [
    { name: "greeting", description: "Saludo inicial", sample: "Hola," },
    { name: "studentDisplayName", description: "Nombre del alumno", sample: "Juan" },
    { name: "contactEmail", description: "Email de contacto del instituto", sample: "contacto@example.com" },
  ],
  defaults: {
    es: {
      subject: "Te extrañamos en el portal",
      bodyHtml: `<p>{{greeting}}</p>
<p>Notamos que <strong>{{studentDisplayName}}</strong> hace tiempo que no abre el portal. Si necesitás ayuda, escribinos.</p>
<p style="font-size:0.875rem;color:#6B7280;">{{contactEmail}}</p>`,
    },
    en: {
      subject: "We miss you on the portal",
      bodyHtml: `<p>{{greeting}}</p>
<p>We noticed <strong>{{studentDisplayName}}</strong> has not opened the student portal recently. If you need help, contact us.</p>
<p style="font-size:0.875rem;color:#6B7280;">{{contactEmail}}</p>`,
    },
  },
};

export const wardEmailChangedTemplate: EmailTemplateDefinition = {
  key: "notifications.ward_email_changed",
  category: "notifications",
  label: {
    es: "Notificaciones: cambio de email del alumno",
    en: "Notifications: student login email changed",
  },
  description: {
    es: "Aviso enviado al email anterior y al nuevo cuando el tutor cambia el correo de acceso del alumno desde su portal. Permite detectar inmediatamente un cambio no autorizado.",
    en: "Sent to the old and new student login email after a parent updates it from the parent portal. Lets the legitimate owner react if the change was not authorised.",
  },
  placeholders: [
    { name: "wardName", description: "Nombre del alumno", sample: "Juan Pérez" },
    { name: "oldEmail", description: "Email anterior", sample: "old@example.com" },
    { name: "newEmail", description: "Email nuevo", sample: "new@example.com" },
    { name: "parentName", description: "Nombre del tutor que hizo el cambio", sample: "María Pérez" },
    { name: "supportEmail", description: "Email de contacto del instituto", sample: "soporte@example.com" },
  ],
  defaults: {
    es: {
      subject: "Cambiamos el correo de acceso de {{wardName}}",
      bodyHtml: `<p>Hola,</p>
<p>El correo de acceso de <strong>{{wardName}}</strong> fue actualizado:</p>
<ul style="padding-left:20px;margin:12px 0;">
  <li>Anterior: <strong>{{oldEmail}}</strong></li>
  <li>Nuevo: <strong>{{newEmail}}</strong></li>
  <li>Realizado por su tutor: {{parentName}}</li>
</ul>
<p>Si vos no autorizaste este cambio, escribinos <strong>de inmediato</strong> a <a href="mailto:{{supportEmail}}">{{supportEmail}}</a> para revertirlo.</p>`,
    },
    en: {
      subject: "We updated {{wardName}}'s login email",
      bodyHtml: `<p>Hi,</p>
<p>The login email for <strong>{{wardName}}</strong> was changed:</p>
<ul style="padding-left:20px;margin:12px 0;">
  <li>Old: <strong>{{oldEmail}}</strong></li>
  <li>New: <strong>{{newEmail}}</strong></li>
  <li>Made by parent: {{parentName}}</li>
</ul>
<p>If you did not authorise this change, contact us <strong>immediately</strong> at <a href="mailto:{{supportEmail}}">{{supportEmail}}</a> so we can revert it.</p>`,
    },
  },
};

export const classReminderPrepTemplate: EmailTemplateDefinition = {
  key: "notifications.class_reminder_prep",
  category: "notifications",
  label: { es: "Recordatorios: preparación de clase", en: "Reminders: class preparation" },
  description: {
    es: "Email de recordatorio enviado horas antes de cada clase para que el alumno se prepare.",
    en: "Reminder email sent hours before each class so the student can prepare.",
  },
  placeholders: [
    { name: "lead", description: "Frase introductoria", sample: "Tenés clase pronto:" },
    { name: "sectionLabel", description: "Sección + curso", sample: "Section A — Cohort 2026" },
    { name: "scheduleLineLabel", description: "Etiqueta del horario", sample: "Inicio (hora del instituto)" },
    { name: "whenLine", description: "Fecha y hora formateadas", sample: "lunes 21 abril 2026, 18:00" },
    { name: "locationLine", description: "Aula o link de la clase online", sample: "Aula 3" },
    { name: "portalLine", description: "Línea con el enlace al portal", sample: "Abrí el portal: https://example.com" },
  ],
  defaults: {
    es: {
      subject: "Recordatorio de clase",
      bodyHtml: `<p>{{lead}}</p>
<ul style="padding-left:20px;margin:12px 0;">
  <li><strong>{{sectionLabel}}</strong></li>
  <li>{{scheduleLineLabel}}: {{whenLine}}</li>
  <li>{{locationLine}}</li>
</ul>
<p style="margin-top:16px;">{{portalLine}}</p>`,
    },
    en: {
      subject: "Class reminder",
      bodyHtml: `<p>{{lead}}</p>
<ul style="padding-left:20px;margin:12px 0;">
  <li><strong>{{sectionLabel}}</strong></li>
  <li>{{scheduleLineLabel}}: {{whenLine}}</li>
  <li>{{locationLine}}</li>
</ul>
<p style="margin-top:16px;">{{portalLine}}</p>`,
    },
  },
};
