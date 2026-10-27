import type { EmailTemplateDefinition } from "@/types/emailTemplates";
import { withPtFallback } from "@/lib/email/templates/withPtEmailDefaults";

export const adminWeeklyDigestTemplate: EmailTemplateDefinition = {
  key: "admin.weekly_digest",
  category: "notifications",
  label: { es: "Reporte semanal para admins", en: "Weekly admin report" },
  description: {
    es: "Correo del lunes con lo que espera revisión y las cifras de la semana cerrada. Si lo apagas, ese envío no sale.",
    en: "Monday mail with waiting work and the closed week's numbers. Turn it off to stop that send.",
  },
  placeholders: [
    { name: "subject", description: "Asunto según lo que espera revisión", sample: "4 comprobantes sin revisar" },
  ],
  defaults: withPtFallback({
    es: {
      subject: "{{subject}}",
      bodyHtml: "<p>El reporte semanal se arma en el envío del lunes.</p>",
    },
    en: {
      subject: "{{subject}}",
      bodyHtml: "<p>The Monday job builds this report.</p>",
    },
  }),
};
