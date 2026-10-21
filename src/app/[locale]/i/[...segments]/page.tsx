import { notFound, permanentRedirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { loadSectionEnrollmentLink } from "@/lib/register/loadSectionEnrollmentLink";
import {
  buildSectionEnrollmentLinkPath,
  parseSectionEnrollmentLinkSegments,
} from "@/lib/register/sectionEnrollmentLinkPath";
import { SectionEnrollmentLinkUnavailable } from "@/components/register/SectionEnrollmentLinkUnavailable";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale: string; segments: string[] }>;
}

export default async function LegacySectionEnrollmentLinkPage({ params }: PageProps) {
  const { locale, segments } = await params;
  const resolved = parseSectionEnrollmentLinkSegments(segments);
  if (!resolved) notFound();
  const link = await loadSectionEnrollmentLink(resolved.token);
  if (!link) {
    const dict = await getDictionary(locale);
    return (
      <SectionEnrollmentLinkUnavailable locale={locale} labels={dict.register.sectionLink} />
    );
  }
  permanentRedirect(buildSectionEnrollmentLinkPath(locale, link.sectionName, resolved.token));
}
