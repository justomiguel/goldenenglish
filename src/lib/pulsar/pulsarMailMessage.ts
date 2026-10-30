import type { BrandPublic } from "@/lib/brand/server";
import { wrapEmailHtml } from "@/lib/email/templates/wrapEmailHtml";
import type { Locale } from "@/types/i18n";

export type PulsarMailKind =
  | "owner_requested_admin"
  | "owner_requested_user"
  | "owner_approved"
  | "owner_rejected"
  | "site_created";

export interface PulsarMailDraft {
  to: string;
  subject: string;
  html: string;
  locale: Locale;
  brandName: string;
}

const PULSAR_LOGO_PATH = "/centrolisto/apple-touch-icon.png";

function escapeMailText(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function fill(template: string, vars: Readonly<Record<string, string>>): string {
  return template.replaceAll(/\{([a-z]+)\}/g, (token, key: string) => escapeMailText(vars[key] ?? ""));
}

/** Drops a Resend key and keeps the detail short enough to store. */
export function clipMailDetail(raw: string): string {
  return raw.replace(/re_[A-Za-z0-9]+/g, "[key]").replace(/\s+/g, " ").trim().slice(0, 180);
}

/** One message body. An empty recipient is skipped. Values are escaped. */
export function pulsarMailMessage(input: {
  to: string;
  subject: string;
  body: string;
  vars: Readonly<Record<string, string>>;
  locale: Locale;
  brandName: string;
}): PulsarMailDraft | null {
  const to = input.to.trim();
  if (!to || !to.includes("@")) return null;
  return {
    to,
    subject: fill(input.subject, input.vars),
    html: `<p>${fill(input.body, input.vars)}</p>`,
    locale: input.locale,
    brandName: input.brandName,
  };
}

/** Full mail document: shared HTML shell plus the CentroListo logo. */
export function renderPulsarMailHtml(input: {
  bodyHtml: string;
  locale: Locale;
  origin: string;
  brandName: string;
  contactEmail: string;
}): string {
  const name = input.brandName.trim() || "CentroListo";
  const brand: BrandPublic = {
    name,
    legalName: name,
    tagline: "",
    taglineEn: "",
    legalRegistry: "",
    logoPath: PULSAR_LOGO_PATH,
    logoAlt: name,
    faviconPath: PULSAR_LOGO_PATH,
    faviconBundlePrefix: null,
    contactEmail: input.contactEmail,
    contactPhone: "",
    contactAddress: "",
    socialFacebook: "",
    socialInstagram: "",
    socialWhatsapp: "",
  };
  return wrapEmailHtml({
    brand,
    origin: input.origin.replace(/\/$/, ""),
    locale: input.locale,
    bodyHtml: input.bodyHtml,
    logoSize: 56,
  });
}
