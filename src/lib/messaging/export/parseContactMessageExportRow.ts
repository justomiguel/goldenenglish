import { contactMetaPhoneCandidates } from "@/lib/messaging/extractContactMetaPhone";
import { extractSiteContactVisitorNameFromPortalHtml } from "@/lib/messaging/siteContactVisitorDisplayName";
import { stripHtmlToText } from "@/lib/messaging/stripHtml";
import {
  orderContactMessageExportFields,
  type ContactMessageExportField,
} from "@/lib/messaging/export/contactMessageExportContract";

const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;

export type ContactMessageExportSource = {
  id: string;
  createdAt: string;
  broadcastBatchId: string | null;
  displayName: string | null;
  replyEmail: string | null;
  bodyHtml: string;
};

export type ContactMessageExportValues = Record<ContactMessageExportField, string>;

export function formatContactMessageExportInstant(
  iso: string,
  locale: string,
  timeZone: string,
): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const options: Intl.DateTimeFormatOptions = { dateStyle: "medium", timeStyle: "short" };
  try {
    return new Intl.DateTimeFormat(locale, { ...options, timeZone }).format(date);
  } catch {
    return new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" }).format(date);
  }
}

export function formatContactMessageExportDay(timeZone: string, now: Date): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
  } catch {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
  }
}

function headHtml(html: string): string {
  return String(html ?? "").split(/<hr\b/i)[0] ?? "";
}

function metaValues(html: string): string[] {
  const paragraphs = [...headHtml(html).matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)];
  const values: string[] = [];
  for (const paragraph of paragraphs) {
    const strong = (paragraph[1] ?? "").match(/<strong[^>]*>([\s\S]*?)<\/strong>\s*([\s\S]*)/i);
    if (!strong) continue;
    const value = stripHtmlToText(strong[2] ?? "");
    values.push(value === "—" ? "" : value);
  }
  return values;
}

function messageBody(html: string): string {
  const parts = String(html ?? "").split(/<hr\b[^>]*>/i);
  if (parts.length < 2) return "";
  const body = parts.slice(1).join("");
  const paragraphs = [...body.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map((match) =>
    stripHtmlToText(match[1] ?? ""),
  );
  const joined = paragraphs.filter(Boolean).join("\n\n");
  return joined || stripHtmlToText(body);
}

export function parseContactMessageExportRow(
  source: ContactMessageExportSource,
  options: { locale: string; timeZone: string },
): ContactMessageExportValues {
  const nameColumn = source.displayName?.trim() ?? "";
  const emailColumn = source.replyEmail?.trim() ?? "";
  const head = stripHtmlToText(headHtml(source.bodyHtml));
  return {
    sentAt: formatContactMessageExportInstant(source.createdAt, options.locale, options.timeZone),
    name: nameColumn || extractSiteContactVisitorNameFromPortalHtml(source.bodyHtml) || "",
    email: emailColumn || head.match(EMAIL_RE)?.[0] || "",
    phone: contactMetaPhoneCandidates(source.bodyHtml)[0] ?? "",
    subject: metaValues(source.bodyHtml)[0] ?? "",
    body: messageBody(source.bodyHtml),
  };
}

export function buildContactMessageExportTable(input: {
  rows: readonly ContactMessageExportValues[];
  fields: readonly ContactMessageExportField[];
  labels: Record<ContactMessageExportField, string>;
}): { headers: string[]; rows: string[][] } {
  const fields = orderContactMessageExportFields(input.fields);
  return {
    headers: fields.map((field) => input.labels[field]),
    rows: input.rows.map((row) => fields.map((field) => row[field])),
  };
}
