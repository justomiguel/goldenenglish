import type { SupabaseClient } from "@supabase/supabase-js";
import { blogStatsRates } from "@/lib/blog/metricFormulas";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

type RpcArticle = {
  articleId: string;
  views: number;
  ctaClicks: number;
  visibleComments: number;
  hasCta: boolean;
};

type RpcPayload = {
  articleViews: number;
  indexArticleViews: number;
  listViews: number;
  articles: RpcArticle[];
};

const EMPTY: RpcPayload = {
  articleViews: 0,
  indexArticleViews: 0,
  listViews: 0,
  articles: [],
};

export async function loadBlogAdminStats(supabase: SupabaseClient, locale: string) {
  const { data, error } = await supabase.rpc("blog_admin_stats_30d");
  if (error) {
    logSupabaseClientError("blog.stats", error);
  }
  const row = Array.isArray(data) ? (data[0] as RpcPayload | undefined) : (data as RpcPayload | null);
  const payload = row ?? EMPTY;
  const rates = blogStatsRates({
    articleViews: payload.articleViews ?? 0,
    indexArticleViews: payload.indexArticleViews ?? 0,
    listViews: payload.listViews ?? 0,
    articles: payload.articles ?? [],
  });

  const ids = rates.rows.map((item) => item.articleId);
  const titles = new Map<string, string>();
  if (ids.length > 0) {
    const { data: translations } = await supabase
      .from("blog_article_translations")
      .select("article_id, title, locale")
      .in("article_id", ids);
    for (const translation of translations ?? []) {
      if (translation.locale === locale || !titles.has(translation.article_id)) {
        titles.set(translation.article_id, translation.title);
      }
    }
  }

  return {
    ...rates,
    rows: rates.rows.map((item) => ({
      ...item,
      title: titles.get(item.articleId) ?? item.articleId,
    })),
  };
}
