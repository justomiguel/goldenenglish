import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import {
  ADMIN_SESSION_FORBIDDEN,
  ADMIN_SESSION_UNAUTHORIZED,
} from "@/lib/dashboard/adminSessionErrors";
import { AdminBadgeFormScreen } from "@/components/dashboard/admin/badges/AdminBadgeFormScreen";
import { buildBadgeAdminPreviewProps } from "@/lib/badges/buildBadgeAdminPreviewProps";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function AdminNewBadgePage({ params }: PageProps) {
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
  const preview = await buildBadgeAdminPreviewProps();
  return (
    <AdminBadgeFormScreen
      mode="create"
      locale={locale}
      labels={dict.admin.badges}
      adminNav={dict.dashboard.adminNav}
      initial={null}
      preview={preview}
      fileUploadProgress={dict.common.fileUpload}
    />
  );
}
