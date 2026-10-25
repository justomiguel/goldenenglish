import type { BrandPublic } from "@/lib/brand/server";
import { taglineForLocale } from "@/lib/brand/taglineForLocale";
import { getPublicSiteUrl } from "@/lib/site/publicUrl";

interface JsonLdOrganizationProps {
  locale: string;
  brand: BrandPublic;
  /** Request origin. When omitted, the env public URL is used. */
  siteOrigin?: string | null;
}

function baseUrlFromOrigin(siteOrigin: string | null | undefined): URL | null {
  if (!siteOrigin) return getPublicSiteUrl();
  try {
    const normalized = siteOrigin.endsWith("/") ? siteOrigin.slice(0, -1) : siteOrigin;
    return new URL(normalized);
  } catch {
    return getPublicSiteUrl();
  }
}

/** Schema.org EducationalOrganization — home / marketing only (omit if no public base URL). */
export function JsonLdOrganization({ locale, brand, siteOrigin }: JsonLdOrganizationProps) {
  const base = baseUrlFromOrigin(siteOrigin);
  if (!base) return null;

  const url = new URL(`/${locale}`, base).toString();
  const logo = new URL(brand.logoPath, base).toString();

  const sameAs = [brand.socialFacebook, brand.socialInstagram].filter(
    (x): x is string => Boolean(x),
  );

  const payload: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: brand.name,
    legalName: brand.legalName,
    description: taglineForLocale(brand, locale),
    url,
    logo,
  };

  if (sameAs.length) payload.sameAs = sameAs;
  if (brand.contactEmail) payload.email = brand.contactEmail;
  if (brand.contactPhone) payload.telephone = brand.contactPhone;
  if (brand.contactAddress) {
    payload.address = {
      "@type": "PostalAddress",
      streetAddress: brand.contactAddress,
    };
  }

  return (
    <script
      type="application/ld+json"
      // JSON-LD is static server output; keys come from branded config only.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}
