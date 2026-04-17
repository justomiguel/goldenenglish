import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import {
  ADMIN_SESSION_FORBIDDEN,
  ADMIN_SESSION_UNAUTHORIZED,
} from "@/lib/dashboard/adminSessionErrors";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { loadAdminSiteThemes } from "@/lib/cms/loadAdminSiteThemes";
import { SiteThemeTemplatesShell } from "@/components/dashboard/admin/cms/SiteThemeTemplatesShell";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function AdminCmsTemplatesPage({ params }: PageProps) {
  const { locale } = await params;

  let supabase: Awaited<ReturnType<typeof assertAdmin>>["supabase"];
  try {
    ({ supabase } = await assertAdmin());
  } catch (err) {
    const message = (err as Error)?.message;
    if (message === ADMIN_SESSION_UNAUTHORIZED) {
      redirect(`/${locale}/login`);
    }
    if (message === ADMIN_SESSION_FORBIDDEN) {
      redirect(`/${locale}/dashboard`);
    }
    throw err;
  }

  const dict = await getDictionary(locale);
  const { rows, total, truncated } = await loadAdminSiteThemes(supabase, {
    includeArchived: true,
  });

  return (
    <SiteThemeTemplatesShell
      locale={locale}
      labels={dict.admin.cms.templates}
      rows={rows}
      total={total}
      truncated={truncated}
    />
  );
}
