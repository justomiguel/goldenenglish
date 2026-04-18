import type { BrandPublic } from "@/lib/brand/server";
import type { Locale } from "@/types/i18n";

export interface WrapEmailHtmlInput {
  brand: BrandPublic;
  /** Origen absoluto del sitio (`https://...`) para resolver el logo y los enlaces. */
  origin: string;
  locale: Locale;
  /** HTML del cuerpo del email (sin layout/header). Lo inyecta el caller. */
  bodyHtml: string;
}

const FOOTER_LABELS: Record<Locale, { contactPrefix: string; address: string }> = {
  es: { contactPrefix: "Contacto", address: "Dirección" },
  en: { contactPrefix: "Contact", address: "Address" },
};

const FONT_STACK =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif";

function escape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function absoluteLogoSrc(brand: BrandPublic, origin: string): string {
  const path = brand.logoPath || "/images/logo.png";
  if (/^https?:\/\//i.test(path)) return path;
  const sep = path.startsWith("/") ? "" : "/";
  return `${origin}${sep}${path}`;
}

/**
 * Envuelve cualquier `bodyHtml` en un layout HTML minimalista, unificado y
 * amigable para clientes de email (tablas + estilos inline). Header con logo
 * + nombre del instituto, body legible, footer con datos de contacto.
 *
 * Es **puro** y server-only-friendly: no toca `fs` ni Supabase. Recibe brand
 * + origin para que el caller controle de dónde vienen.
 */
export function wrapEmailHtml(input: WrapEmailHtmlInput): string {
  const { brand, origin, locale, bodyHtml } = input;
  const labels = FOOTER_LABELS[locale];
  const logoSrc = absoluteLogoSrc(brand, origin);
  const safeBrandName = escape(brand.name || "");
  const safeBrandAlt = escape(brand.logoAlt || brand.name || "");
  const safeContactEmail = escape(brand.contactEmail || "");
  const safeAddress = escape(brand.contactAddress || "");
  const safeLegal = escape(brand.legalName || brand.name || "");

  const footerLines: string[] = [];
  if (safeAddress) {
    footerLines.push(`<strong>${labels.address}:</strong> ${safeAddress}`);
  }
  if (safeContactEmail) {
    footerLines.push(
      `<strong>${labels.contactPrefix}:</strong> <a href="mailto:${safeContactEmail}" style="color:#103A5C;text-decoration:none;">${safeContactEmail}</a>`,
    );
  }
  const footerHtml = footerLines.map((line) => `<p style="margin:4px 0;">${line}</p>`).join("");

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${safeBrandName}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:${FONT_STACK};color:#111827;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3f4f6;padding:32px 12px;">
  <tr>
    <td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(15,23,42,0.08);">
        <tr>
          <td style="padding:24px 28px;border-bottom:1px solid #e5e7eb;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="vertical-align:middle;">
                  <img src="${logoSrc}" alt="${safeBrandAlt}" height="40" style="display:block;height:40px;width:auto;border:0;" />
                </td>
                <td style="vertical-align:middle;padding-left:14px;font-weight:600;font-size:16px;color:#103A5C;">
                  ${safeBrandName}
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:28px;font-size:15px;line-height:1.6;color:#111827;">
            ${bodyHtml}
          </td>
        </tr>
        <tr>
          <td style="padding:18px 28px 24px;border-top:1px solid #e5e7eb;background:#fafafa;font-size:12px;color:#6B7280;line-height:1.5;">
            <p style="margin:0 0 6px;font-weight:600;color:#374151;">${safeLegal}</p>
            ${footerHtml}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}
