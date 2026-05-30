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
import { blogAttachmentsToDraftMaterials } from "@/lib/blog/mapDraftMaterials";
import { parseBlogAttachmentsFromDb } from "@/lib/blog/attachments";
import { BLOG_LOCALES, type BlogLocale } from "@/lib/blog/domain";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function AdminBlogEditPage({ params }: PageProps) {
  const { locale, id } = await params;
  let supabase: Awaited<ReturnType<typeof assertBlogAuthor>>["supabase"];
  try {
    ({ supabase } = await assertBlogAuthor());
  } catch (error) {
    const message = (error as Error)?.message;
    if (message === ADMIN_SESSION_UNAUTHORIZED) redirect(`/${locale}/login`);
    if (message === ADMIN_SESSION_FORBIDDEN) redirect(`/${locale}/dashboard`);
    throw error;
  }

  const { data: article } = await supabase
    .from("blog_articles")
    .select("id, status, tags, is_pinned, scheduled_for, default_locale")
    .eq("id", id)
    .maybeSingle();
  if (!article) redirect(`/${locale}/dashboard/admin/cms/blog`);

  const { data: translationRows } = await supabase
    .from("blog_article_translations")
    .select("locale, title, excerpt, body_html, attachments")
    .eq("article_id", id);

  const translationsByLocale: Partial<
    Record<
      BlogLocale,
      {
        title: string;
        excerpt: string;
        bodyHtml: string;
        materials: ReturnType<typeof blogAttachmentsToDraftMaterials>;
      }
    >
  > = {};
  for (const row of translationRows ?? []) {
    const blogLocale = row.locale as BlogLocale;
    if (!BLOG_LOCALES.includes(blogLocale)) continue;
    translationsByLocale[blogLocale] = {
      title: row.title ?? "",
      excerpt: row.excerpt ?? "",
      bodyHtml: row.body_html ?? "<p></p>",
      materials: blogAttachmentsToDraftMaterials(parseBlogAttachmentsFromDb(row.attachments)),
    };
  }

  const dict = await getDictionary(locale);
  const credentials = await loadGoogleTranslateCredentials(supabase);
  const defaultLocale = (article.default_locale as BlogLocale) ?? "es";

  return (
    <BlogArticleEditor
      locale={locale}
      articleId={id}
      labels={dict.admin.cms.blog.editor}
      academicLabels={dict.dashboard.adminContents}
      fileUploadProgress={dict.common.fileUpload}
      initial={{
        defaultLocale,
        status: article.status,
        tags: article.tags ?? [],
        scheduledFor: article.scheduled_for
          ? new Date(article.scheduled_for).toISOString().slice(0, 16)
          : "",
        isPinned: Boolean(article.is_pinned),
        hasGoogleKey: Boolean(credentials.apiKey),
        translationsByLocale,
      }}
    />
  );
}
