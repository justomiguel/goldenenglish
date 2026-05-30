import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { assertBlogAuthor } from "@/lib/dashboard/assertBlogAuthor";
import {
  ADMIN_SESSION_FORBIDDEN,
  ADMIN_SESSION_UNAUTHORIZED,
} from "@/lib/dashboard/adminSessionErrors";
import { BlogArticleEditor } from "@/components/dashboard/admin/cms/blog/BlogArticleEditor";
import { loadGoogleTranslateCredentials } from "@/lib/blog/integrations/google/loadGoogleTranslateCredentials";
import { BLOG_LOCALES, type BlogLocale } from "@/lib/blog/domain";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function AdminBlogNewPage({ params }: PageProps) {
  const { locale } = await params;
  let supabase: Awaited<ReturnType<typeof assertBlogAuthor>>["supabase"];
  try {
    ({ supabase } = await assertBlogAuthor());
  } catch (error) {
    const message = (error as Error)?.message;
    if (message === ADMIN_SESSION_UNAUTHORIZED) redirect(`/${locale}/login`);
    if (message === ADMIN_SESSION_FORBIDDEN) redirect(`/${locale}/dashboard`);
    throw error;
  }

  const dict = await getDictionary(locale);
  const credentials = await loadGoogleTranslateCredentials(supabase);
  const startLocale = (BLOG_LOCALES.includes(locale as BlogLocale)
    ? locale
    : "es") as BlogLocale;

  return (
    <BlogArticleEditor
      locale={locale}
      labels={dict.admin.cms.blog.editor}
      academicLabels={dict.dashboard.adminContents}
      fileUploadProgress={dict.common.fileUpload}
      initial={{
        defaultLocale: startLocale,
        status: "draft",
        tags: [],
        scheduledFor: "",
        isPinned: false,
        hasGoogleKey: Boolean(credentials.apiKey),
        translationsByLocale: {},
      }}
    />
  );
}
