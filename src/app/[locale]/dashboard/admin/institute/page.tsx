import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { isEmailTemplatesMegaAdmin } from "@/lib/auth/emailTemplatesMegaAdmin";
import { loadBlogEnabled } from "@/lib/blog/loadBlogEnabled";
import { buildAdminInstituteHubGroups } from "@/lib/dashboard/buildAdminInstituteHubGroups";
import { AdminInstituteHub } from "@/components/dashboard/AdminInstituteHub";
import { buildPageMetadata } from "@/lib/metadata/buildPageMetadata";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  return buildPageMetadata(locale, (d) => d.dashboard.adminNav.institute);
}

export default async function AdminInstitutePage({ params }: PageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [blogEnabled] = await Promise.all([loadBlogEnabled()]);
  const groups = buildAdminInstituteHubGroups(
    `/${locale}/dashboard/admin`,
    dict.dashboard.adminNav,
    {
      includeBlogNav: blogEnabled,
      includeEmailTemplatesNav: isEmailTemplatesMegaAdmin(user?.email),
    },
  );

  return (
    <AdminInstituteHub
      title={dict.dashboard.adminNav.institute}
      lead={dict.dashboard.adminNav.tipInstitute}
      groups={groups}
    />
  );
}
