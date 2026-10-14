import { fillTemplate } from "@/lib/i18n/fillTemplate";

export const EVENT_EMAIL_TEMPLATE_KEYS = [
  "events.registered",
  "events.payment_approved",
  "events.payment_rejected",
  "events.reminder",
] as const;

export type EventEmailTemplateKey = (typeof EVENT_EMAIL_TEMPLATE_KEYS)[number];

export const EVENT_EMAIL_CONFIRMATION_KEYS = [
  "events.registered",
  "events.payment_approved",
] as const;

export const EVENT_EMAIL_VARIABLES = [
  "firstName",
  "lastName",
  "eventName",
  "flowName",
  "eventDate",
  "eventLocation",
] as const;

export type EventEmailVariable = (typeof EVENT_EMAIL_VARIABLES)[number];

export const EVENT_EMAIL_LOCALES = ["es", "en", "pt"] as const;

export type EventEmailLocale = (typeof EVENT_EMAIL_LOCALES)[number];

export interface EventEmailCopyRow {
  templateKey: EventEmailTemplateKey;
  locale: string;
  flowId: string | null;
  subject: string;
  bodyHtml: string;
}

export function eventEmailAllowsFlow(templateKey: string): boolean {
  return (EVENT_EMAIL_CONFIRMATION_KEYS as readonly string[]).includes(templateKey);
}

export function parseEventEmailLocale(raw: string | null | undefined): EventEmailLocale {
  return raw === "en" || raw === "pt" ? raw : "es";
}

export function escapeEventEmailHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function escapeEventEmailVars(vars: Record<string, string>): Record<string, string> {
  const escaped: Record<string, string> = {};
  for (const key of EVENT_EMAIL_VARIABLES) {
    if (vars[key] != null) escaped[key] = escapeEventEmailHtml(vars[key]);
  }
  return escaped;
}

/** Flow copy, then the event-wide copy. Reminder and rejection ignore the flow. */
export function pickEventEmailCopy(
  rows: EventEmailCopyRow[],
  input: { templateKey: EventEmailTemplateKey; locale: string; flowId?: string | null },
): { subject: string; bodyHtml: string } | null {
  const same = rows.filter((row) => row.templateKey === input.templateKey && row.locale === input.locale);
  const flowId = eventEmailAllowsFlow(input.templateKey) ? (input.flowId ?? null) : null;
  if (flowId) {
    const flowRow = same.find((row) => row.flowId === flowId);
    if (flowRow) return { subject: flowRow.subject, bodyHtml: flowRow.bodyHtml };
  }
  const eventRow = same.find((row) => row.flowId == null);
  return eventRow ? { subject: eventRow.subject, bodyHtml: eventRow.bodyHtml } : null;
}

export function applyEventEmailVars(
  template: { subject: string; bodyHtml: string },
  vars: Record<string, string>,
): { subject: string; bodyHtml: string } {
  const escaped = escapeEventEmailVars(vars);
  return {
    subject: fillTemplate(template.subject, escaped),
    bodyHtml: fillTemplate(template.bodyHtml, escaped),
  };
}
