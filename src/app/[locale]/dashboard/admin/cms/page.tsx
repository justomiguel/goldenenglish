import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { loadBlogEnabled } from "@/lib/blog/loadBlogEnabled";
import { AdminCmsHubScreen } from "@/components/dashboard/admin/cms/AdminCmsHubScreen";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string }>;
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
