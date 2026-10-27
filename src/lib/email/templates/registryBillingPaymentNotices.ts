import type { EmailTemplateDefinition } from "@/types/emailTemplates";
import { withPtFallback } from "@/lib/email/templates/withPtEmailDefaults";
import type { Locale } from "@/types/i18n";

export const ADMIN_PAID_KIND_LABEL: Record<Locale, Record<"event" | "tuition" | "shop", string>> = {
  es: { event: "Evento", tuition: "Mensualidad", shop: "Tienda" },
  en: { event: "Event", tuition: "Monthly tuition", shop: "Shop" },
  pt: { event: "Evento", tuition: "Mensualidad", shop: "Tienda" },
};

export const ADMIN_RECEIPT_KIND_LABEL: Record<
  Locale,
  Record<"event" | "tuition" | "enrollment" | "invoice", string>
> = {
  es: { event: "Evento", tuition: "Mensualidad", enrollment: "Matrícula", invoice: "Factura" },
  en: { event: "Event", tuition: "Monthly tuition", enrollment: "Enrollment fee", invoice: "Invoice" },
  pt: { event: "Evento", tuition: "Mensualidad", enrollment: "Matrícula", invoice: "Factura" },
};

export const receiptSubmittedPendingTemplate: EmailTemplateDefinition = {
  key: "billing.receipt_submitted_pending",
  category: "billing",
  label: {
    es: "Facturación: comprobante recibido (pendiente)",
    en: "Billing: receipt received (pending review)",
  },
  description: {
    es: "Confirma que se subió un comprobante y está en cola de revisión.",
    en: "Confirms a receipt was uploaded and is pending staff review.",
  },
  placeholders: [
    { name: "periodLabel", description: "Período MM/AAAA", sample: "03/2026" },
    { name: "amountLabel", description: "Monto", sample: "USD 120" },
    { name: "sectionName", description: "Sección (o guión)", sample: "A2 Morning" },
  ],
  defaults: withPtFallback({
    es: {
      subject: "Recibimos tu comprobante · {{periodLabel}}",
      bodyHtml: `<p style="margin:0 0 12px;">Hola,</p>
<p style="margin:0 0 12px;">Recibimos el comprobante de pago para <strong>{{periodLabel}}</strong> ({{amountLabel}}) en <strong>{{sectionName}}</strong>.</p>
<p style="margin:0;color:#6B7280;font-size:0.875rem;">Lo revisaremos y te avisaremos por correo.</p>`,
    },
    en: {
      subject: "We received your receipt · {{periodLabel}}",
      bodyHtml: `<p style="margin:0 0 12px;">Hello,</p>
<p style="margin:0 0 12px;">We received your payment receipt for <strong>{{periodLabel}}</strong> ({{amountLabel}}) — <strong>{{sectionName}}</strong>.</p>
<p style="margin:0;color:#6B7280;font-size:0.875rem;">Our team will review it and email you with the result.</p>`,
    },
  }),
};

export const monthlyPaymentApprovedTemplate: EmailTemplateDefinition = {
  key: "billing.monthly_payment_approved",
  category: "billing",
  label: { es: "Facturación: pago aprobado", en: "Billing: payment approved" },
  description: {
    es: "Aviso al aprobar el comprobante de un mes.",
    en: "Sent when a monthly payment receipt is approved.",
  },
  placeholders: [
    { name: "periodLabel", description: "Período", sample: "03/2026" },
    { name: "amountLabel", description: "Monto aprobado", sample: "USD 120" },
  ],
  defaults: withPtFallback({
    es: {
      subject: "Pago aprobado · {{periodLabel}}",
      bodyHtml: `<p style="margin:0 0 12px;">Hola,</p>
<p style="margin:0;">Aprobamos el pago de <strong>{{periodLabel}}</strong> por <strong>{{amountLabel}}</strong>.</p>`,
    },
    en: {
      subject: "Payment approved · {{periodLabel}}",
      bodyHtml: `<p style="margin:0 0 12px;">Hello,</p>
<p style="margin:0;">Your payment for <strong>{{periodLabel}}</strong> — <strong>{{amountLabel}}</strong> — is approved.</p>`,
    },
  }),
};

export const monthlyPaymentRejectedTemplate: EmailTemplateDefinition = {
  key: "billing.monthly_payment_rejected",
  category: "billing",
  label: { es: "Facturación: pago rechazado", en: "Billing: payment rejected" },
  description: {
    es: "Aviso al rechazar un comprobante; puede incluir nota interna visible.",
    en: "Sent when a receipt is rejected; may include a note.",
  },
  placeholders: [
    { name: "periodLabel", description: "Período", sample: "03/2026" },
    { name: "rejectionNote", description: "Nota (opcional)", sample: "—" },
  ],
  defaults: withPtFallback({
    es: {
      subject: "Comprobante no aprobado · {{periodLabel}}",
      bodyHtml: `<p style="margin:0 0 12px;">Hola,</p>
<p style="margin:0 0 8px;">No pudimos aprobar el comprobante de <strong>{{periodLabel}}</strong>.</p>
<p style="margin:0;color:#6B7280;font-size:0.875rem;">{{rejectionNote}}</p>`,
    },
    en: {
      subject: "Receipt not approved · {{periodLabel}}",
      bodyHtml: `<p style="margin:0 0 12px;">Hello,</p>
<p style="margin:0 0 8px;">We could not approve the receipt for <strong>{{periodLabel}}</strong>.</p>
<p style="margin:0;color:#6B7280;font-size:0.875rem;">{{rejectionNote}}</p>`,
    },
  }),
};

export const adminRecordedMonthlyPaidTemplate: EmailTemplateDefinition = {
  key: "billing.admin_recorded_monthly_paid",
  category: "billing",
  label: {
    es: "Facturación: pago registrado por administración",
    en: "Billing: payment recorded by the office",
  },
  description: {
    es: "Cuando el personal marca un mes como pagado sin comprobante.",
    en: "When staff records a month as paid without a receipt on file.",
  },
  placeholders: [
    { name: "periodLabel", description: "Período", sample: "03/2026" },
    { name: "amountLabel", description: "Monto", sample: "USD 120" },
    { name: "sectionName", description: "Sección", sample: "A2 Morning" },
  ],
  defaults: withPtFallback({
    es: {
      subject: "Pago registrado · {{periodLabel}}",
      bodyHtml: `<p style="margin:0 0 12px;">Hola,</p>
<p style="margin:0;">Registramos en el sistema el pago de <strong>{{periodLabel}}</strong> ({{amountLabel}}) en <strong>{{sectionName}}</strong>.</p>`,
    },
    en: {
      subject: "Payment recorded · {{periodLabel}}",
      bodyHtml: `<p style="margin:0 0 12px;">Hello,</p>
<p style="margin:0;">We recorded your payment for <strong>{{periodLabel}}</strong> ({{amountLabel}}) — <strong>{{sectionName}}</strong>.</p>`,
    },
  }),
};

export const overdueBalanceReminderTemplate: EmailTemplateDefinition = {
  key: "billing.overdue_balance_reminder",
  category: "billing",
  label: { es: "Facturación: recordatorio de saldo vencido", en: "Billing: overdue balance reminder" },
  description: {
    es: "Aviso de monto vencido en un período; envío administrativo a la familia.",
    en: "Overdue amount reminder sent by staff to the family.",
  },
  placeholders: [
    { name: "sectionName", description: "Sección", sample: "A2 Morning" },
    { name: "amountLabel", description: "Monto vencido", sample: "USD 240" },
    { name: "periodContext", description: "Contexto de período o año", sample: "2026" },
  ],
  defaults: withPtFallback({
    es: {
      subject: "Recordatorio: cuota pendiente · {{sectionName}}",
      bodyHtml: `<p style="margin:0 0 12px;">Hola,</p>
<p style="margin:0 0 8px;">Tu cuenta muestra <strong>{{amountLabel}}</strong> vencido en <strong>{{sectionName}}</strong> ({{periodContext}}).</p>
<p style="margin:0;color:#6B7280;font-size:0.875rem;">Sube el comprobante o escríbenos si ya pagaste.</p>`,
    },
    en: {
      subject: "Reminder: balance due · {{sectionName}}",
      bodyHtml: `<p style="margin:0 0 12px;">Hello,</p>
<p style="margin:0 0 8px;">Your account shows <strong>{{amountLabel}}</strong> overdue for <strong>{{sectionName}}</strong> ({{periodContext}}).</p>
<p style="margin:0;color:#6B7280;font-size:0.875rem;">Please upload a receipt or contact us if you have already paid.</p>`,
    },
  }),
};

export const paymentsAdminPaidTemplate: EmailTemplateDefinition = {
  key: "payments.admin_paid",
  category: "notifications",
  label: { es: "Pago recibido (admin)", en: "Payment received (admin)" },
  description: {
    es: "Avisa a cada admin cuando un pago queda pagado por primera vez.",
    en: "Tells each admin when a payment first becomes paid.",
  },
  placeholders: [
    { name: "paymentKind", description: "Evento, mensualidad o tienda", sample: "Evento" },
    { name: "contextLabel", description: "Evento, período o pedido", sample: "Concierto" },
    { name: "payerName", description: "Quién pagó", sample: "Pérez Ana" },
    { name: "amountLabel", description: "Monto", sample: "CLP 20.000" },
  ],
  defaults: withPtFallback({
    es: {
      subject: "Pago recibido · {{contextLabel}}",
      bodyHtml:
        "<p>Un pago quedó pagado.</p><p>{{paymentKind}}: {{contextLabel}}.</p><p>{{payerName}}. {{amountLabel}}.</p>",
    },
    en: {
      subject: "Payment received · {{contextLabel}}",
      bodyHtml:
        "<p>A payment is now paid.</p><p>{{paymentKind}}: {{contextLabel}}.</p><p>{{payerName}}. {{amountLabel}}.</p>",
    },
  }),
};

export const paymentsAdminReceiptPendingTemplate: EmailTemplateDefinition = {
  key: "payments.admin_receipt_pending",
  category: "notifications",
  label: { es: "Comprobante por aprobar (admin)", en: "Receipt to approve (admin)" },
  description: {
    es: "Avisa a cada admin que un comprobante quedó pendiente de aprobación.",
    en: "Tells each admin that a receipt is waiting for approval.",
  },
  placeholders: [
    { name: "paymentKind", description: "Evento, mensualidad o matrícula", sample: "Evento" },
    { name: "contextLabel", description: "Evento, período o sección", sample: "Concierto" },
    { name: "payerName", description: "Quién subió el comprobante", sample: "Pérez Ana" },
    { name: "amountLabel", description: "Monto", sample: "CLP 20.000" },
  ],
  defaults: withPtFallback({
    es: {
      subject: "Comprobante por aprobar · {{contextLabel}}",
      bodyHtml:
        "<p>Llegó un comprobante y está pendiente de aprobación.</p><p>{{paymentKind}}: {{contextLabel}}.</p><p>{{payerName}}. {{amountLabel}}.</p>",
    },
    en: {
      subject: "Receipt to approve · {{contextLabel}}",
      bodyHtml:
        "<p>A receipt arrived and is waiting for approval.</p><p>{{paymentKind}}: {{contextLabel}}.</p><p>{{payerName}}. {{amountLabel}}.</p>",
    },
  }),
};

export const BILLING_PAYMENT_NOTICE_TEMPLATES: ReadonlyArray<EmailTemplateDefinition> = [
  receiptSubmittedPendingTemplate,
  monthlyPaymentApprovedTemplate,
  monthlyPaymentRejectedTemplate,
  adminRecordedMonthlyPaidTemplate,
  overdueBalanceReminderTemplate,
  paymentsAdminPaidTemplate,
  paymentsAdminReceiptPendingTemplate,
];
