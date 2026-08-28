import type { EmailTemplateDefinition } from "@/types/emailTemplates";
import { withPtFallback } from "@/lib/email/templates/withPtEmailDefaults";

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
  defaults: withPtFallback({
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
  }),
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
  defaults: withPtFallback({
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
  }),
};

const portalLinkStyle = "color:#103A5C;text-decoration:underline;font-weight:600;";

export const adminStudentWelcomeTemplate: EmailTemplateDefinition = {
  key: "notifications.admin_student_welcome",
  category: "notifications",
  label: {
    es: "Alta admin: bienvenida al alumno",
    en: "Admin create: student welcome",
  },
  description: {
    es: "Cuando el admin da de alta a un alumno mayor con email real: bienvenida, acceso al portal y pedido de cambiar la contraseña.",
    en: "When staff creates an adult student with a real email: welcome, portal access, and a password-change request.",
  },
  placeholders: [
    { name: "greetingName", description: "Nombre del alumno", sample: "Luis" },
    { name: "studentName", description: "Nombre completo del alumno", sample: "Luis Pérez" },
    { name: "portalUrl", description: "URL de ingreso al portal", sample: "https://example.com/es/login" },
  ],
  defaults: withPtFallback({
    es: {
      subject: "Bienvenido al portal",
      bodyHtml: `<p style="margin:0 0 12px;">Hola {{greetingName}},</p>
<p style="margin:0 0 12px;">Ya estás inscripto. Podés entrar al portal con tu usuario.</p>
<p style="margin:0 0 12px;">Por seguridad, debés cambiar la contraseña en el primer ingreso.</p>
<p style="margin:0;"><a href="{{portalUrl}}" style="${portalLinkStyle}">Entrar al portal</a></p>`,
    },
    en: {
      subject: "Welcome to the portal",
      bodyHtml: `<p style="margin:0 0 12px;">Hi {{greetingName}},</p>
<p style="margin:0 0 12px;">You are enrolled. You can sign in to the portal with your account.</p>
<p style="margin:0 0 12px;">For security, please change your password the first time you sign in.</p>
<p style="margin:0;"><a href="{{portalUrl}}" style="${portalLinkStyle}">Open the portal</a></p>`,
    },
  }),
};

export const adminTutorWelcomeTemplate: EmailTemplateDefinition = {
  key: "notifications.admin_tutor_welcome",
  category: "notifications",
  label: {
    es: "Alta admin: bienvenida al tutor",
    en: "Admin create: guardian welcome",
  },
  description: {
    es: "Cuando el admin da de alta a un menor: el tutor recibe la bienvenida, el acceso al portal familiar y el pedido de cambiar su contraseña. El alumno no se invita.",
    en: "When staff creates a minor: the guardian gets the welcome, family-portal access, and a password-change request. The child is not invited.",
  },
  placeholders: [
    { name: "greetingName", description: "Nombre del alumno (contexto)", sample: "Ana" },
    { name: "studentName", description: "Nombre completo del alumno", sample: "Ana García" },
    { name: "portalUrl", description: "URL de ingreso al portal", sample: "https://example.com/es/login" },
  ],
  defaults: withPtFallback({
    es: {
      subject: "Bienvenida: {{studentName}} ya está inscripto",
      bodyHtml: `<p style="margin:0 0 12px;">Hola,</p>
<p style="margin:0 0 12px;"><strong>{{studentName}}</strong> ya está inscripto en el instituto.</p>
<p style="margin:0 0 12px;">Como tutor podés entrar al portal familiar para ver su información.</p>
<p style="margin:0 0 12px;">Por seguridad, debés cambiar tu contraseña en el primer ingreso.</p>
<p style="margin:0;"><a href="{{portalUrl}}" style="${portalLinkStyle}">Entrar al portal</a></p>`,
    },
    en: {
      subject: "Welcome: {{studentName}} is enrolled",
      bodyHtml: `<p style="margin:0 0 12px;">Hi,</p>
<p style="margin:0 0 12px;"><strong>{{studentName}}</strong> is now enrolled at the institute.</p>
<p style="margin:0 0 12px;">As their guardian you can sign in to the family portal to follow their progress.</p>
<p style="margin:0 0 12px;">For security, please change your password the first time you sign in.</p>
<p style="margin:0;"><a href="{{portalUrl}}" style="${portalLinkStyle}">Open the portal</a></p>`,
    },
  }),
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
  defaults: withPtFallback({
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
  }),
};
