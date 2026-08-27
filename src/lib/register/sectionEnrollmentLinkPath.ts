import { isSectionEnrollmentLinkToken } from "@/lib/register/sectionEnrollmentLink";
import { slugifyPublicPathSegment } from "@/lib/site/slugifyPublicPathSegment";

const EMPTY_SLUG = "seccion";

export function buildSectionEnrollmentLinkPath(
  locale: string,
  sectionName: string,
  token: string,
): string {
  const slug = slugifyPublicPathSegment(sectionName) || EMPTY_SLUG;
  return `/${locale}/i/${slug}/${token}`;
}

export function parseSectionEnrollmentLinkSegments(
  parts: string[],
): { slug: string | null; token: string } | null {
  if (parts.length === 1 && isSectionEnrollmentLinkToken(parts[0])) {
    return { slug: null, token: parts[0] };
  }
  if (parts.length === 2 && isSectionEnrollmentLinkToken(parts[1])) {
    return { slug: parts[0] ?? null, token: parts[1] };
  }
  return null;
}
