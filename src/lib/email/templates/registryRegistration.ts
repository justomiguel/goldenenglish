import type { EmailTemplateDefinition } from "@/types/emailTemplates";
import { withPtFallback } from "@/lib/email/templates/withPtEmailDefaults";
import {
  adminEnrolledTemplate,
  adminNeedsSectionTemplate,
  adminReceiptPendingTemplate,
  adminReceivedTemplate,
} from "@/lib/email/templates/registryRegistrationAdmin";
import {
  REGISTRATION_TRIAL_EMAIL_KEYS,
  REGISTRATION_TRIAL_EMAIL_TEMPLATES,
} from "@/lib/email/templates/registryRegistrationTrial";

const FAMILY_PLACEHOLDERS = [
  { name: "greetingName", description: "Nombre del destinatario", sample: "María" },
  { name: "studentName", description: "Nombre del alumno", sample: "Juan Pérez" },
  { name: "sectionName", description: "Sección o “horario por asignar”", sample: "A2 Mañana" },
  { name: "scheduleLabel", description: "Horario", sample: "Lun y mié 18:00" },
  { name: "amountLabel", description: "Monto de matrícula", sample: "CLP 80.000" },
  { name: "payBlock", description: "CTA de pago o texto sin matrícula", sample: "" },
];

export const REGISTRATION_EMAIL_KEYS = [
  "registration.received",
  "registration.admin_received",
  "registration.admin_receipt_pending",
  "registration.admin_enrolled",
  "registration.admin_needs_section",
  "registration.welcome",
  "registration.receipt_rejected",
  "registration.section_full",
  ...REGISTRATION_TRIAL_EMAIL_KEYS,
] as const;

export const receivedTemplate: EmailTemplateDefinition = {
  key: "registration.received",
  category: "notifications",
  label: { es: "Inscripción: preinscripción recibida", en: "Registration: we received your form" },
  description: {
    es: "Confirma a la familia que llegó la preinscripción. Incluye aviso de cupo y, si hay matrícula, el botón para pagar.",
    en: "Confirms the pre-inscription. Warns seats can run out and links to pay matrícula when due.",
  },
  placeholders: FAMILY_PLACEHOLDERS,
  defaults: withPtFallback({
    es: {
      subject: "Recibimos la preinscripción de {{studentName}}",
      bodyHtml: `<p style="margin:0 0 12px;">Hola {{greetingName}},</p>
<p style="margin:0 0 12px;">Recibimos la preinscripción de <strong>{{studentName}}</strong> para <strong>{{sectionName}}</strong> ({{scheduleLabel}}).</p>
<p style="margin:0 0 12px;">Vamos a intentar dejarlo en ese horario, pero los cupos se pueden acabar antes de que se confirme el lugar.</p>
{{payBlock}}`,
    },
    en: {
      subject: "We received {{studentName}}'s pre-registration",
      bodyHtml: `<p style="margin:0 0 12px;">Hi {{greetingName}},</p>
<p style="margin:0 0 12px;">We received the pre-registration for <strong>{{studentName}}</strong> in <strong>{{sectionName}}</strong> ({{scheduleLabel}}).</p>
<p style="margin:0 0 12px;">We will try to keep that schedule, but seats can run out before the place is confirmed.</p>
{{payBlock}}`,
    },
  }),
};

export const welcomeTemplate: EmailTemplateDefinition = {
  key: "registration.welcome",
  category: "notifications",
  label: { es: "Inscripción: bienvenida", en: "Registration: welcome" },
  description: {
    es: "Tras el alta o el pago: bienvenida, horario y acceso al portal.",
    en: "After enrol or payment: welcome, schedule, and portal access.",
  },
  placeholders: [
    ...FAMILY_PLACEHOLDERS,
    { name: "inviteUrl", description: "Link para definir contraseña (o vacío)", sample: "" },
  ],
  defaults: withPtFallback({
    es: {
      subject: "Bienvenido a {{sectionName}}",
      bodyHtml: `<p style="margin:0 0 12px;">Hola {{greetingName}},</p>
<p style="margin:0 0 12px;">{{studentName}} ya está en <strong>{{sectionName}}</strong>.</p>
<p style="margin:0 0 12px;">Horario: {{scheduleLabel}}</p>
<p style="margin:0 0 12px;">Ya podés entrar al portal. Por seguridad, cambiá la contraseña en el primer ingreso.</p>
<p style="margin:0 0 12px;"><a href="{{inviteUrl}}" style="color:#103A5C;text-decoration:underline;font-weight:600;">Entrar al portal</a></p>
{{payBlock}}`,
    },
    en: {
      subject: "Welcome to {{sectionName}}",
      bodyHtml: `<p style="margin:0 0 12px;">Hi {{greetingName}},</p>
<p style="margin:0 0 12px;"><strong>{{studentName}}</strong> is now in <strong>{{sectionName}}</strong>.</p>
<p style="margin:0 0 12px;">Schedule: {{scheduleLabel}}</p>
<p style="margin:0 0 12px;">You can sign in to the portal. For security, change your password the first time you sign in.</p>
<p style="margin:0 0 12px;"><a href="{{inviteUrl}}" style="color:#103A5C;text-decoration:underline;font-weight:600;">Open the portal</a></p>
{{payBlock}}`,
    },
  }),
};

export const receiptRejectedTemplate: EmailTemplateDefinition = {
  key: "registration.receipt_rejected",
  category: "notifications",
  label: { es: "Inscripción: comprobante rechazado", en: "Registration: receipt rejected" },
  description: {
    es: "El admin rechazó el comprobante de matrícula. Incluye el mismo link de pago.",
    en: "Admin rejected the matrícula receipt. Includes the same pay link.",
  },
  placeholders: FAMILY_PLACEHOLDERS,
  defaults: withPtFallback({
    es: {
      subject: "No pudimos validar el comprobante de matrícula",
      bodyHtml: `<p style="margin:0 0 12px;">Hola {{greetingName}},</p>
<p style="margin:0 0 12px;">No pudimos validar el comprobante de matrícula de <strong>{{studentName}}</strong>.</p>
<p style="margin:0 0 12px;">Podés volver a pagar o subir otro comprobante:</p>
{{payBlock}}`,
    },
    en: {
      subject: "We could not validate the enrollment-fee receipt",
      bodyHtml: `<p style="margin:0 0 12px;">Hi {{greetingName}},</p>
<p style="margin:0 0 12px;">We could not validate the enrollment-fee receipt for <strong>{{studentName}}</strong>.</p>
<p style="margin:0 0 12px;">You can pay again or upload another receipt:</p>
{{payBlock}}`,
    },
  }),
};

export const sectionFullTemplate: EmailTemplateDefinition = {
  key: "registration.section_full",
  category: "notifications",
  label: { es: "Inscripción: horario lleno", en: "Registration: schedule full" },
  description: {
    es: "El horario pedido se llenó. El mismo link permite elegir otro o escribir al instituto.",
    en: "The requested schedule filled. Same link to pick another or contact the institute.",
  },
  placeholders: FAMILY_PLACEHOLDERS,
  defaults: withPtFallback({
    es: {
      subject: "Se llenó el horario de {{sectionName}}",
      bodyHtml: `<p style="margin:0 0 12px;">Hola {{greetingName}},</p>
<p style="margin:0 0 12px;">El horario de <strong>{{sectionName}}</strong> se llenó antes de confirmar el lugar de {{studentName}}.</p>
<p style="margin:0 0 12px;">En este link podés elegir otro horario con cupo o escribirnos:</p>
{{payBlock}}`,
    },
    en: {
      subject: "{{sectionName}} is full",
      bodyHtml: `<p style="margin:0 0 12px;">Hi {{greetingName}},</p>
<p style="margin:0 0 12px;"><strong>{{sectionName}}</strong> filled up before we could confirm a seat for {{studentName}}.</p>
<p style="margin:0 0 12px;">Use this link to pick another open schedule or contact us:</p>
{{payBlock}}`,
    },
  }),
};

export const REGISTRATION_EMAIL_TEMPLATES: ReadonlyArray<EmailTemplateDefinition> = [
  receivedTemplate,
  adminReceivedTemplate,
  adminReceiptPendingTemplate,
  adminEnrolledTemplate,
  adminNeedsSectionTemplate,
  welcomeTemplate,
  receiptRejectedTemplate,
  sectionFullTemplate,
  ...REGISTRATION_TRIAL_EMAIL_TEMPLATES,
];
