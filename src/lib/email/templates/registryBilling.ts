import type { EmailTemplateDefinition } from "@/types/emailTemplates";

export const enrollmentExemptionTemplate: EmailTemplateDefinition = {
  key: "billing.enrollment_exemption",
  category: "billing",
  label: { es: "Facturación: exención de matrícula", en: "Billing: enrollment exemption" },
  description: {
    es: "Confirma a la familia que se aplicó una exención de matrícula al alumno.",
    en: "Confirms to the family that the student's enrollment fee has been waived.",
  },
  placeholders: [
    { name: "enrollmentTerm", description: "Etiqueta del término (matrícula)", sample: "Matrícula" },
    { name: "enrollmentTermLower", description: "Mismo término en minúsculas", sample: "matrícula" },
    { name: "reason", description: "Motivo de la exención (opcional)", sample: "Beca de excelencia académica" },
  ],
  defaults: {
    es: {
      subject: "Exención de {{enrollmentTerm}} aplicada",
      bodyHtml: `<h1 style="font-size:1.25rem;margin:0 0 12px;">Exención de {{enrollmentTerm}} aplicada</h1>
<p>Aplicamos una exención de {{enrollmentTermLower}} en la cuenta del estudiante.</p>
<p style="color:#6B7280;font-size:0.875rem;">{{reason}}</p>`,
    },
    en: {
      subject: "{{enrollmentTerm}} exemption applied",
      bodyHtml: `<h1 style="font-size:1.25rem;margin:0 0 12px;">{{enrollmentTerm}} exemption applied</h1>
<p>We have applied an {{enrollmentTermLower}} exemption to the student's account.</p>
<p style="color:#6B7280;font-size:0.875rem;">{{reason}}</p>`,
    },
  },
};

export const promotionAppliedTemplate: EmailTemplateDefinition = {
  key: "billing.promotion_applied",
  category: "billing",
  label: { es: "Facturación: promoción aplicada", en: "Billing: promotion applied" },
  description: {
    es: "Notifica a la familia que se aplicó una promoción / descuento al pago.",
    en: "Notifies the family that a promotion / discount was applied to the payment.",
  },
  placeholders: [
    { name: "promotionTerm", description: "Etiqueta del término (promoción)", sample: "Promoción" },
    { name: "promotionTermLower", description: "Mismo término en minúsculas", sample: "promoción" },
    { name: "promotionName", description: "Nombre de la promoción", sample: "Beca hermanos" },
    { name: "code", description: "Código aplicado", sample: "HERM10" },
  ],
  defaults: {
    es: {
      subject: "{{promotionTerm}} aplicada a tu pago",
      bodyHtml: `<h1 style="font-size:1.25rem;margin:0 0 12px;">{{promotionTerm}} aplicada</h1>
<p>Se aplicó la {{promotionTermLower}} <strong>{{promotionName}}</strong> con el código <strong>{{code}}</strong>.</p>`,
    },
    en: {
      subject: "{{promotionTerm}} applied to your payment",
      bodyHtml: `<h1 style="font-size:1.25rem;margin:0 0 12px;">{{promotionTerm}} applied</h1>
<p>The {{promotionTermLower}} <strong>{{promotionName}}</strong> was applied with code <strong>{{code}}</strong>.</p>`,
    },
  },
};
