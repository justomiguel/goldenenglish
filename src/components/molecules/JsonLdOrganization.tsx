import type { BrandPublic } from "@/lib/brand/server";
import { taglineForLocale } from "@/lib/brand/taglineForLocale";
import {
  buildInstituteAddress,
  buildInstituteDepartments,
  isPublishablePublicContact,
  type InstitutePlace,
} from "@/lib/public/instituteAnswerPages";
import { getPublicSiteUrl } from "@/lib/site/publicUrl";

interface JsonLdOrganizationProps {
  locale: string;
  brand: BrandPublic;
  /** Request origin. When omitted, the env public URL is used. */
  siteOrigin?: string | null;
  templateKind?: string;
  places?: readonly InstitutePlace[];
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
export function JsonLdOrganization({
  locale,
  brand,
  siteOrigin,
  templateKind = "",
  places = [],
}: JsonLdOrganizationProps) {
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
  if (isPublishablePublicContact("email", brand.contactEmail)) {
    payload.email = brand.contactEmail.trim();
  }
  if (isPublishablePublicContact("phone", brand.contactPhone)) {
    payload.telephone = brand.contactPhone.trim();
  }
  if (isPublishablePublicContact("address", brand.contactAddress)) {
    payload.address = buildInstituteAddress(brand.contactAddress);
  }
  const departments = buildInstituteDepartments(templateKind, places);
  if (departments.length) payload.department = departments;

  return (
    <script
      type="application/ld+json"
      // JSON-LD is static server output; keys come from branded config only.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}
