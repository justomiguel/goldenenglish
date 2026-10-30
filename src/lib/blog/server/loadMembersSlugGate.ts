import { membersArticleRedirectPath } from "@/lib/blog/articleVisibility";
import { logSupabaseError } from "@/lib/logging/serverActionLog";
import { createAdminClient } from "@/lib/supabase/admin";

const TRANSLATION_COLUMNS = "article_id, slug";
const ARTICLE_COLUMNS = "id, visibility, status, published_at";

type TranslationGateRow = {
  article_id: string;
  slug: string;
};

type ArticleGateRow = {
  visibility: string;
  status: string;
  published_at: string | null;
};

function isPublishedNow(status: string, publishedAt: string | null): boolean {
  if (status !== "published" || publishedAt == null || publishedAt.length === 0) return false;
  const at = Date.parse(publishedAt);
  return Number.isFinite(at) && at <= Date.now();
}

export async function membersSlugRedirectForAnonymous(input: {
  locale: string;
  slug: string;
  isSignedIn: boolean;
}): Promise<string | null> {
  if (input.isSignedIn) return null;

  const admin = await createAdminClient();
  const { data: translation, error: translationError } = await admin
    .from("blog_article_translations")
    .select(TRANSLATION_COLUMNS)
    .eq("locale", input.locale)
    .eq("slug", input.slug)
    .maybeSingle();

  if (translationError) {
    logSupabaseError("blog.membersSlugGate.translation", translationError, {
      locale: input.locale,
    });
    return null;
  }

  const translationRow = translation as TranslationGateRow | null;
  if (!translationRow?.article_id || !translationRow.slug) return null;

  const { data: article, error: articleError } = await admin
    .from("blog_articles")
    .select(ARTICLE_COLUMNS)
    .eq("id", translationRow.article_id)
    .maybeSingle();

  if (articleError) {
    logSupabaseError("blog.membersSlugGate.article", articleError, {
      locale: input.locale,
    });
    return null;
  }

  const articleRow = article as ArticleGateRow | null;
  if (!articleRow) return null;
  if (!isPublishedNow(articleRow.status, articleRow.published_at)) return null;
  if (articleRow.visibility !== "members") return null;

  return membersArticleRedirectPath({
    locale: input.locale,
    slug: translationRow.slug,
    visibility: "members",
    isSignedIn: false,
  });
}
