import { notFound, permanentRedirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { loadPublicStudentBadgeShareByToken } from "@/lib/badges/loadPublicStudentBadgeShare";
import { loadPublicBadgeCatalogEntryByCode } from "@/lib/badges/loadPublicBadgeCatalogEntry";
import { resolveBadgeTranslation } from "@/lib/badges/badgeCatalog";
import { isStudentBadgeCode } from "@/lib/badges/badgeCodes";
import { buildBadgeSharePath } from "@/lib/site/publicSharePaths";

interface PageProps {
  params: Promise<{ locale: string; token: string }>;
}

export default async function LegacyPublicStudentBadgePage({ params }: PageProps) {
  const { locale, token } = await params;
  const data = await loadPublicStudentBadgeShareByToken(token);
  if (!data || !isStudentBadgeCode(data.badgeCode)) notFound();
  const catalog = await loadPublicBadgeCatalogEntryByCode(data.badgeCode);
  const title = catalog
    ? resolveBadgeTranslation(
        { code: data.badgeCode, translations: catalog.translations },
        locale,
      ).title
    : data.badgeCode;
  const dict = await getDictionary(locale);
  const fallback =
    dict.dashboard.student.badges.definitions[
      data.badgeCode as keyof typeof dict.dashboard.student.badges.definitions
    ];
  const shareTitle =
    title ||
    (fallback && typeof fallback === "object" && "title" in fallback
      ? String(fallback.title)
      : data.badgeCode);
  permanentRedirect(buildBadgeSharePath(locale, shareTitle, token));
}
