import type {
  EmailTemplateCategory,
  EmailTemplateDefinition,
  EmailTemplateKey,
} from "@/types/emailTemplates";
import {
  replyTemplate,
  staffPortalNewTemplate,
  teacherNewTemplate,
} from "@/lib/email/templates/registryMessaging";
import {
  enrollmentExemptionTemplate,
  promotionAppliedTemplate,
} from "@/lib/email/templates/registryBilling";
import { BILLING_PAYMENT_NOTICE_TEMPLATES } from "@/lib/email/templates/registryBillingPaymentNotices";
import {
  gradePublishedParentTemplate,
  retentionContactTemplate,
  transferApprovedTemplate,
} from "@/lib/email/templates/registryAcademics";
import {
  churnInactivityTemplate,
  classReminderPrepTemplate,
  wardEmailChangedTemplate,
} from "@/lib/email/templates/registryNotifications";

/**
 * Catálogo cerrado de plantillas de email del producto. Es la fuente de verdad
 * de **qué** emails sale al cliente final; la BD (`email_templates`) solo
 * guarda overrides editables por (key, locale).
 *
 * Para añadir un emisor nuevo: agregar el `EmailTemplateDefinition` aquí,
 * llamar `sendBrandedEmail({ key, ... })` desde el adapter, y ese template
 * aparece automáticamente en el combo del admin sin migración SQL.
 */
const REGISTRY: ReadonlyArray<EmailTemplateDefinition> = [
  teacherNewTemplate,
  staffPortalNewTemplate,
  replyTemplate,
  enrollmentExemptionTemplate,
  promotionAppliedTemplate,
  ...BILLING_PAYMENT_NOTICE_TEMPLATES,
  transferApprovedTemplate,
  gradePublishedParentTemplate,
  retentionContactTemplate,
  churnInactivityTemplate,
  classReminderPrepTemplate,
  wardEmailChangedTemplate,
];

const REGISTRY_BY_KEY = new Map<EmailTemplateKey, EmailTemplateDefinition>(
  REGISTRY.map((t) => [t.key, t]),
);

export function listEmailTemplateDefinitions(): ReadonlyArray<EmailTemplateDefinition> {
  return REGISTRY;
}

export function getEmailTemplateDefinition(
  key: EmailTemplateKey,
): EmailTemplateDefinition | null {
  return REGISTRY_BY_KEY.get(key) ?? null;
}

export function isKnownEmailTemplateKey(key: string): boolean {
  return REGISTRY_BY_KEY.has(key);
}

export const EMAIL_TEMPLATE_CATEGORIES: ReadonlyArray<EmailTemplateCategory> = [
  "messaging",
  "billing",
  "academics",
  "churn",
  "notifications",
];
