import { getDictionary } from "@/lib/i18n/dictionaries";
import { loadBlogEnabled } from "@/lib/blog/loadBlogEnabled";
import { AdminCmsHubScreen } from "@/components/dashboard/admin/cms/AdminCmsHubScreen";
import { buildPageMetadata } from "@/lib/metadata/buildPageMetadata";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  return buildPageMetadata(locale, (d) => d.admin.cms.hubTitle);
}

export default async function AdminCmsHubPage({ params }: PageProps) {
  const { locale } = await params;
  const [dict, blogEnabled] = await Promise.all([getDictionary(locale), loadBlogEnabled()]);

  return (
    <AdminCmsHubScreen
      locale={locale}
      dict={dict.admin.cms}
      blogEnabled={blogEnabled}
    />
  );
}
