import type { EmailTemplateDefinition, EmailTemplatePlaceholder } from "@/types/emailTemplates";
import { withPtFallback } from "@/lib/email/templates/withPtEmailDefaults";

export const REGISTRATION_ADMIN_PLACEHOLDERS: EmailTemplatePlaceholder[] = [
  { name: "studentName", description: "Alumno", sample: "Juan Pérez" },
  { name: "studentDni", description: "DNI del alumno", sample: "12.345.678-9" },
  { name: "studentBirth", description: "Fecha de nacimiento", sample: "2014-03-02" },
  { name: "tutorBlock", description: "Ficha del tutor o vacío", sample: "" },
  { name: "sectionName", description: "Secciones pedidas", sample: "A2 Mañana" },
  { name: "scheduleLabel", description: "Horario", sample: "Lun y mié 18:00" },
  { name: "amountLabel", description: "Monto snapshot", sample: "CLP 80.000" },
  { name: "feeModeLabel", description: "Una / por sección", sample: "Una matrícula para todas" },
  { name: "sourceLabel", description: "Origen del lead", sample: "/register" },
  { name: "existingStudentLabel", description: "Ya es alumno", sample: "Sí" },
  { name: "adminUrl", description: "Link a la preinscripción", sample: "https://example.com/es/dashboard/admin/registrations" },
];

function adminBody(lead: string): string {
  return `<p style="margin:0 0 12px;">${lead}</p>
<p style="margin:0 0 8px;"><strong>{{studentName}}</strong> · DNI {{studentDni}} · {{studentBirth}}</p>
{{tutorBlock}}
<p style="margin:0 0 8px;">Sección: {{sectionName}} ({{scheduleLabel}})</p>
<p style="margin:0 0 8px;">Matrícula: {{amountLabel}} · {{feeModeLabel}}</p>
<p style="margin:0 0 8px;">Origen: {{sourceLabel}} · Ya es alumno: {{existingStudentLabel}}</p>
<p style="margin:0;"><a href="{{adminUrl}}">Abrir preinscripción</a></p>`;
}

export const adminReceivedTemplate: EmailTemplateDefinition = {
  key: "registration.admin_received",
  category: "notifications",
  label: { es: "Inscripción: nueva preinscripción (admin)", en: "Registration: new lead (admin)" },
  description: {
    es: "Aviso a cada admin cuando entra una preinscripción, con ficha completa.",
    en: "Notifies each admin when a lead arrives, with the full ficha.",
  },
  placeholders: REGISTRATION_ADMIN_PLACEHOLDERS,
  defaults: withPtFallback({
    es: {
      subject: "Nueva preinscripción · {{studentName}}",
      bodyHtml: adminBody("Llegó una preinscripción nueva."),
    },
    en: {
      subject: "New pre-registration · {{studentName}}",
      bodyHtml: adminBody("A new pre-registration arrived."),
    },
  }),
};

export const adminReceiptPendingTemplate: EmailTemplateDefinition = {
  key: "registration.admin_receipt_pending",
  category: "notifications",
  label: { es: "Inscripción: comprobante por revisar (admin)", en: "Registration: receipt to review (admin)" },
  description: {
    es: "La familia subió un comprobante de matrícula.",
    en: "The family uploaded a matrícula receipt.",
  },
  placeholders: REGISTRATION_ADMIN_PLACEHOLDERS,
  defaults: withPtFallback({
    es: {
      subject: "Comprobante por revisar · {{studentName}}",
      bodyHtml: adminBody("Hay un comprobante de matrícula para revisar."),
    },
    en: {
      subject: "Receipt to review · {{studentName}}",
      bodyHtml: adminBody("There is an enrollment-fee receipt to review."),
    },
  }),
};

export const adminEnrolledTemplate: EmailTemplateDefinition = {
  key: "registration.admin_enrolled",
  category: "notifications",
  label: { es: "Inscripción: nuevo alumno (admin)", en: "Registration: new student (admin)" },
  description: {
    es: "Alta automática o aprobada: el alumno ya está en la sección y el cupo bajó.",
    en: "Auto or approved enrol: the student is in the section and the seat was taken.",
  },
  placeholders: REGISTRATION_ADMIN_PLACEHOLDERS,
  defaults: withPtFallback({
    es: {
      subject: "Nuevo alumno en {{sectionName}}",
      bodyHtml: adminBody("Hay un alumno nuevo en la sección. El cupo ya se actualizó."),
    },
    en: {
      subject: "New student in {{sectionName}}",
      bodyHtml: adminBody("A new student joined the section. The seat count is updated."),
    },
  }),
};

export const adminNeedsSectionTemplate: EmailTemplateDefinition = {
  key: "registration.admin_needs_section",
  category: "notifications",
  label: { es: "Inscripción: pagó, falta horario (admin)", en: "Registration: paid, needs schedule (admin)" },
  description: {
    es: "Pagó o le eximieron la matrícula sin sección. Hay que asignar horario.",
    en: "Paid or waived matrícula with no section. Admin must assign a schedule.",
  },
  placeholders: REGISTRATION_ADMIN_PLACEHOLDERS,
  defaults: withPtFallback({
    es: {
      subject: "Pagó matrícula — falta horario · {{studentName}}",
      bodyHtml: adminBody("Pagó la matrícula y todavía no tiene sección. Asignale un horario con cupo."),
    },
    en: {
      subject: "Paid enrollment fee — needs a schedule · {{studentName}}",
      bodyHtml: adminBody("The enrollment fee is paid and there is still no section. Assign an open schedule."),
    },
  }),
};
