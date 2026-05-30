import type { SupabaseClient } from "@supabase/supabase-js";
import type { BlogLocale } from "@/lib/blog/domain";
import { loadArticleBySlug } from "@/lib/blog/server/loadArticleBySlug";
import { resolveBlogCoverImageUrl } from "@/lib/rich-content/resolvePublicContentCoverUrl";

export async function loadBlogArticleShareCover(
  supabase: SupabaseClient,
  locale: BlogLocale,
  slug: string,
): Promise<{ title: string; coverImageUrl: string | null } | null> {
  const { article, translation } = await loadArticleBySlug(supabase, locale, slug);
  if (!article || !translation) return null;

  return {
    title: translation.seoTitle ?? translation.title,
    coverImageUrl: resolveBlogCoverImageUrl(
      translation.bodyHtml,
      article.coverStoragePath,
    ),
  };
}
