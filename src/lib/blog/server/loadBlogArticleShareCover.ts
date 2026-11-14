import type { SupabaseClient } from "@supabase/supabase-js";
import type { BlogLocale } from "@/lib/blog/domain";
import { loadArticleBySlug } from "@/lib/blog/server/loadArticleBySlug";
import { resolveBlogCoverImageUrl } from "@/lib/rich-content/resolvePublicContentCoverUrl";
import { toAbsoluteShareUrl } from "@/lib/site/buildPublicShareMetadata";
import { readRequestSupabasePublicEnv } from "@/lib/supabase/requestPublicEnv";

export async function loadBlogArticleShareCover(
  supabase: SupabaseClient,
  locale: BlogLocale,
  slug: string,
): Promise<{ title: string; coverImageUrl: string | null } | null> {
  const [{ article, translation }, { url: supabaseUrl }] = await Promise.all([
    loadArticleBySlug(supabase, locale, slug),
    readRequestSupabasePublicEnv(),
  ]);
  if (!article || !translation) return null;

  const coverImageUrl = resolveBlogCoverImageUrl(
    translation.bodyHtml,
    article.coverStoragePath,
    supabaseUrl,
  );

  return {
    title: translation.seoTitle ?? translation.title,
    coverImageUrl: coverImageUrl ? await toAbsoluteShareUrl(coverImageUrl) : null,
  };
}
