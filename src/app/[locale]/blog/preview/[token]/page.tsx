import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseBlogAttachmentsFromDb } from "@/lib/blog/attachments";
import { verifyBlogPreviewToken } from "@/lib/blog/previewToken";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { BlogArticleDetailSurfaceEntry } from "@/components/organisms/BlogArticleDetailSurfaceEntry";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string; token: string }>;
}

export default async function BlogPreviewPage({ params }: PageProps) {
  noStore();

  const { locale, token } = await params;
  const dict = await getDictionary(locale);
  const payload = verifyBlogPreviewToken(token);
  if (!payload) notFound();

  const supabase = await createClient();
  const { data: translation } = await supabase
    .from("blog_article_translations")
    .select("title, excerpt, body_html, attachments")
    .eq("article_id", payload.articleId)
    .eq("locale", locale)
    .maybeSingle();
  if (!translation) notFound();

  return (
    <BlogArticleDetailSurfaceEntry
      title={translation.title}
      excerpt={translation.excerpt}
      bodyHtml={translation.body_html}
      attachments={parseBlogAttachmentsFromDb(translation.attachments)}
      attachmentsTitle={dict.blog.detail.attachmentsTitle}
    />
  );
}
