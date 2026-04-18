import type { EmailTemplateDefinition } from "@/types/emailTemplates";

const previewBlockStyle =
  "border-left:3px solid #cccccc;padding:8px 12px;margin:12px 0;color:#374151;background:#f9fafb;";

const linkStyle = "color:#103A5C;text-decoration:underline;font-weight:600;";

export const teacherNewTemplate: EmailTemplateDefinition = {
  key: "messaging.teacher_new",
  category: "messaging",
  label: { es: "Mensajería: nuevo mensaje al profesor", en: "Messaging: new message to teacher" },
  description: {
    es: "Notifica al profesor que un alumno o tutor le envió un mensaje desde el portal.",
    en: "Notifies the teacher that a student or guardian sent them a portal message.",
  },
  placeholders: [
    { name: "senderName", description: "Quien envía el mensaje", sample: "María Pérez" },
    { name: "messagePreview", description: "Resumen del mensaje (sin HTML)", sample: "Hola, ¿podríamos hablar sobre..." },
    { name: "href", description: "URL al inbox del docente", sample: "https://example.com/es/dashboard/teacher/messages" },
  ],
  defaults: {
    es: {
      subject: "Nuevo mensaje del portal",
      bodyHtml: `<p>Tenés un nuevo mensaje de <strong>{{senderName}}</strong>.</p>
<blockquote style="${previewBlockStyle}">{{messagePreview}}</blockquote>
<p><a href="{{href}}" style="${linkStyle}">Abrir el inbox del docente</a></p>`,
    },
    en: {
      subject: "New portal message",
      bodyHtml: `<p>You have a new message from <strong>{{senderName}}</strong>.</p>
<blockquote style="${previewBlockStyle}">{{messagePreview}}</blockquote>
<p><a href="{{href}}" style="${linkStyle}">Open teacher inbox</a></p>`,
    },
  },
};

export const staffPortalNewTemplate: EmailTemplateDefinition = {
  key: "messaging.staff_portal_new",
  category: "messaging",
  label: { es: "Mensajería: nuevo mensaje al portal", en: "Messaging: new portal message" },
  description: {
    es: "Notifica a un destinatario (alumno, tutor, profesor o admin) que recibió un mensaje desde el portal.",
    en: "Notifies a recipient (student, guardian, teacher or admin) of a new portal message.",
  },
  placeholders: [
    { name: "senderName", description: "Quien envía el mensaje", sample: "Recepción" },
    { name: "messagePreview", description: "Resumen del mensaje", sample: "Recordatorio: cambio de aula..." },
    { name: "href", description: "URL al portal del destinatario", sample: "https://example.com/es/dashboard/student/messages" },
    { name: "openLinkLabel", description: "Texto del enlace", sample: "Abrir el portal" },
  ],
  defaults: {
    es: {
      subject: "Nuevo mensaje en tu portal",
      bodyHtml: `<p>Tenés un nuevo mensaje de <strong>{{senderName}}</strong>.</p>
<blockquote style="${previewBlockStyle}">{{messagePreview}}</blockquote>
<p><a href="{{href}}" style="${linkStyle}">{{openLinkLabel}}</a></p>`,
    },
    en: {
      subject: "New message in your portal",
      bodyHtml: `<p>You have a new message from <strong>{{senderName}}</strong>.</p>
<blockquote style="${previewBlockStyle}">{{messagePreview}}</blockquote>
<p><a href="{{href}}" style="${linkStyle}">{{openLinkLabel}}</a></p>`,
    },
  },
};

export const replyTemplate: EmailTemplateDefinition = {
  key: "messaging.reply",
  category: "messaging",
  label: { es: "Mensajería: respuesta del profesor", en: "Messaging: teacher reply" },
  description: {
    es: "Notifica al alumno o tutor que un docente respondió su mensaje en el portal.",
    en: "Notifies the student or guardian that a teacher replied to their portal message.",
  },
  placeholders: [
    { name: "teacherName", description: "Profesor que responde", sample: "Prof. Gómez" },
    { name: "replyPreview", description: "Resumen de la respuesta", sample: "Sí, podemos vernos el martes..." },
    { name: "href", description: "URL al portal", sample: "https://example.com/es/dashboard/student/messages" },
    { name: "openLinkLabel", description: "Texto del enlace", sample: "Abrir mensajes" },
  ],
  defaults: {
    es: {
      subject: "Tenés una respuesta a tu mensaje",
      bodyHtml: `<p><strong>{{teacherName}}</strong> respondió a tu mensaje.</p>
<blockquote style="${previewBlockStyle}">{{replyPreview}}</blockquote>
<p><a href="{{href}}" style="${linkStyle}">{{openLinkLabel}}</a></p>`,
    },
    en: {
      subject: "Reply to your message",
      bodyHtml: `<p><strong>{{teacherName}}</strong> replied to your message.</p>
<blockquote style="${previewBlockStyle}">{{replyPreview}}</blockquote>
<p><a href="{{href}}" style="${linkStyle}">{{openLinkLabel}}</a></p>`,
    },
  },
};
