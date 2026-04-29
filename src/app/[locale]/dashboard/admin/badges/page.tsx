import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import {
  ADMIN_SESSION_FORBIDDEN,
  ADMIN_SESSION_UNAUTHORIZED,
} from "@/lib/dashboard/adminSessionErrors";
import { loadFullBadgeCatalog } from "@/lib/badges/loadBadgeCatalog";
import { badgeImagePublicUrl } from "@/lib/badges/badgeImagePublicUrl";
import { resolveBadgeTranslation } from "@/lib/badges/badgeCatalog";
import {
  AdminBadgesListScreen,
  type AdminBadgeRow,
} from "@/components/dashboard/admin/badges/AdminBadgesListScreen";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function AdminBadgesPage({ params }: PageProps) {
  const { locale } = await params;
  try {
    await assertAdmin();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === ADMIN_SESSION_UNAUTHORIZED) redirect(`/${locale}/login`);
    if (msg === ADMIN_SESSION_FORBIDDEN) redirect(`/${locale}/dashboard`);
    throw err;
  }
  const dict = await getDictionary(locale);
  const catalog = await loadFullBadgeCatalog();
  const rows: AdminBadgeRow[] = catalog.map((entry) => {
    const en = resolveBadgeTranslation({ code: entry.code, translations: entry.translations }, "en");
    return {
      id: entry.id,
      code: entry.code,
      category: entry.category,
      criteriaType: entry.criteriaType,
      criteriaThreshold: entry.criteriaThreshold,
      sortOrder: entry.sortOrder,
      isActive: entry.isActive,
      imageUrl: badgeImagePublicUrl(entry.imagePath),
      titleEn: en.title,
    };
  });
  return (
    <AdminBadgesListScreen
      locale={locale}
      rows={rows}
      labels={dict.admin.badges}
      adminNav={dict.dashboard.adminNav}
    />
  );
}
