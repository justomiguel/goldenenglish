import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n/dictionaries";
import { getPublicSiteUrl } from "@/lib/site/publicUrl";
import { createClient } from "@/lib/supabase/server";

/** Public marketing + auth entry; admin/dashboard excluded (noindex elsewhere). */
const INDEXED_PATHS = ["", "/login", "/contact", "/blog", "/events"] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getPublicSiteUrl();
  if (!base) return [];

  const supabase = await createClient();
  const { data: blogTranslations } = await supabase
    .from("blog_article_translations")
    .select("locale, slug, blog_articles!inner(status, published_at)")
    .eq("blog_articles.status", "published")
    .not("blog_articles.published_at", "is", null)
    .lte("blog_articles.published_at", new Date().toISOString())
    .limit(1000);

  const { data: eventRows } = await supabase
    .from("events")
    .select("slug, updated_at")
    .eq("status", "published")
    .is("archived_at", null)
    .limit(1000);

  const blogPathsByLocale = new Map<string, string[]>();
  for (const locale of locales) blogPathsByLocale.set(locale, []);
  for (const row of blogTranslations ?? []) {
    const locale = String(row.locale ?? "");
    const slug = String(row.slug ?? "");
    if (!locale || !slug || !blogPathsByLocale.has(locale)) continue;
    blogPathsByLocale.get(locale)!.push(`/blog/${slug}`);
  }

  const entries: MetadataRoute.Sitemap = [];
  for (const locale of locales) {
    for (const suffix of INDEXED_PATHS) {
      const path = `/${locale}${suffix}`;
      entries.push({
        url: new URL(path, base).toString(),
        lastModified: new Date(),
        changeFrequency: suffix === "" ? "weekly" : "monthly",
        priority: suffix === "" ? 1 : 0.7,
      });
    }
    for (const suffix of blogPathsByLocale.get(locale) ?? []) {
      entries.push({
        url: new URL(`/${locale}${suffix}`, base).toString(),
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
    for (const event of eventRows ?? []) {
      const slug = String(event.slug ?? "");
      if (!slug) continue;
      entries.push({
        url: new URL(`/${locale}/events/${slug}`, base).toString(),
        lastModified: event.updated_at ? new Date(String(event.updated_at)) : new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  }
  return entries;
}
