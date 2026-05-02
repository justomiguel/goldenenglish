import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import {
  ADMIN_SESSION_FORBIDDEN,
  ADMIN_SESSION_UNAUTHORIZED,
} from "@/lib/dashboard/adminSessionErrors";
import { loadBadgeCatalogEntryById } from "@/lib/badges/loadBadgeCatalog";
import { badgeImagePublicUrl } from "@/lib/badges/badgeImagePublicUrl";
import {
  AdminBadgeFormScreen,
  type AdminBadgeFormInitial,
} from "@/components/dashboard/admin/badges/AdminBadgeFormScreen";
import { buildBadgeAdminPreviewProps } from "@/lib/badges/buildBadgeAdminPreviewProps";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string; badgeId: string }>;
}

const UUID_RE = /^[0-9a-f-]{36}$/i;

export default async function AdminEditBadgePage({ params }: PageProps) {
  const { locale, badgeId } = await params;
  if (!UUID_RE.test(badgeId)) notFound();
  try {
    await assertAdmin();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === ADMIN_SESSION_UNAUTHORIZED) redirect(`/${locale}/login`);
    if (msg === ADMIN_SESSION_FORBIDDEN) redirect(`/${locale}/dashboard`);
    throw err;
  }
  const dict = await getDictionary(locale);
  const entry = await loadBadgeCatalogEntryById(badgeId);
  if (!entry) notFound();

  const initial: AdminBadgeFormInitial = {
    id: entry.id,
    code: entry.code,
    category: entry.category,
    criteriaType: entry.criteriaType,
    criteriaThreshold: entry.criteriaThreshold,
    sortOrder: entry.sortOrder,
    isActive: entry.isActive,
    imageUrl: badgeImagePublicUrl(entry.imagePath),
    titleEn: entry.translations.en?.title ?? "",
    descriptionEn: entry.translations.en?.description ?? "",
    titleEs: entry.translations.es?.title ?? "",
    descriptionEs: entry.translations.es?.description ?? "",
  };

  const preview = await buildBadgeAdminPreviewProps();

  return (
    <AdminBadgeFormScreen
      mode="edit"
      locale={locale}
      labels={dict.admin.badges}
      adminNav={dict.dashboard.adminNav}
      initial={initial}
      preview={preview}
      fileUploadProgress={dict.common.fileUpload}
    />
  );
}
