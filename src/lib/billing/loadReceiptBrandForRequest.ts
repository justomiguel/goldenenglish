import "server-only";
import { cache } from "react";
import { getBrandForRequest } from "@/lib/brand/server";
import { getPublicSiteUrl } from "@/lib/site/publicUrl";
import { getProperty } from "@/lib/theme/themeParser";
import { loadEffectiveProperties } from "@/lib/theme/loadEffectiveProperties";
import type { PaymentReceiptInputBrand } from "@/lib/billing/buildPaymentReceiptModel";

const FALLBACK_PRIMARY = "#103A5C";

/**
 * Receipt header data for the active tenant. Merges brand layer (system.properties +
 * site_themes overrides) with the primary color used as PDF emphasis. Logo URL is forced
 * absolute because PDFs render outside the browser context.
 */
export const loadReceiptBrandForRequest = cache(async (): Promise<PaymentReceiptInputBrand> => {
  const [brand, effective] = await Promise.all([getBrandForRequest(), loadEffectiveProperties()]);
  const siteUrl = (getPublicSiteUrl()?.origin ?? "http://localhost:3000").replace(/\/+$/, "");
  const absoluteLogoUrl = ensureAbsolute(brand.logoPath, siteUrl);
  const primary = sanitizeHex(getProperty(effective.properties, "color.primary", FALLBACK_PRIMARY));
  return {
    name: brand.name,
    legalName: brand.legalName,
    legalRegistry: brand.legalRegistry,
    logoUrl: absoluteLogoUrl,
    contactAddress: brand.contactAddress,
    contactEmail: brand.contactEmail,
    contactPhone: brand.contactPhone,
    primaryColor: primary,
  };
});

function ensureAbsolute(maybeRelative: string, siteUrl: string): string {
  if (/^https?:\/\//i.test(maybeRelative) || /^data:/i.test(maybeRelative)) return maybeRelative;
  if (maybeRelative.startsWith("/")) return `${siteUrl}${maybeRelative}`;
  return `${siteUrl}/${maybeRelative}`;
}

function sanitizeHex(raw: string): string {
  const trimmed = raw.trim();
  return /^#[0-9A-Fa-f]{3,8}$/.test(trimmed) ? trimmed : FALLBACK_PRIMARY;
}
