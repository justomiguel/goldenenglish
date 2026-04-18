import type { BrandPublic } from "@/lib/brand/server";
import type {
  EmailTemplateDefinition,
  EmailTemplateOverrideRow,
} from "@/types/emailTemplates";
import type { Locale } from "@/types/i18n";

export interface EmailTemplatesShellEntry {
  definition: EmailTemplateDefinition;
  overridesByLocale: Record<Locale, EmailTemplateOverrideRow | null>;
}

export type EmailTemplatesShellBrand = Pick<
  BrandPublic,
  "name" | "legalName" | "logoPath" | "logoAlt" | "contactEmail" | "contactAddress"
>;

export function buildBrandForPreview(brand: EmailTemplatesShellBrand): BrandPublic {
  return {
    name: brand.name,
    legalName: brand.legalName,
    tagline: "",
    taglineEn: "",
    legalRegistry: "",
    logoPath: brand.logoPath,
    logoAlt: brand.logoAlt,
    faviconPath: "",
    contactEmail: brand.contactEmail,
    contactPhone: "",
    contactAddress: brand.contactAddress,
    socialFacebook: "",
    socialInstagram: "",
    socialWhatsapp: "",
  };
}

export function defaultsFor(entry: EmailTemplatesShellEntry, locale: Locale) {
  const override = entry.overridesByLocale[locale];
  if (override) return { subject: override.subject, bodyHtml: override.bodyHtml };
  return entry.definition.defaults[locale];
}

export function buildSampleVars(definition: EmailTemplateDefinition): Record<string, string> {
  const out: Record<string, string> = {};
  for (const p of definition.placeholders) out[p.name] = p.sample;
  return out;
}
