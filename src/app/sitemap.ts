import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n/dictionaries";
import { getRequestPublicSiteUrl } from "@/lib/site/requestPublicUrl";
import { createClient } from "@/lib/supabase/server";
import { isPulsarCrawlHost } from "@/lib/tenant/tenantRegistry";

export const dynamic = "force-dynamic";

/** Public marketing + auth entry; admin/dashboard excluded (noindex elsewhere). */
const INDEXED_PATHS = ["", "/login", "/contact", "/privacidad", "/blog", "/events"] as const;
const ANSWER_PATH = "/preguntas";
const PULSAR_PATHS = ["", "/producto", "/clientes", "/contacto"] as const;

function staticEntries(base: URL, suffixes: readonly string[]): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];
  for (const locale of locales) {
    for (const suffix of suffixes) {
      entries.push({
        url: new URL(`/${locale}${suffix}`, base).toString(),
        lastModified: new Date(),
        changeFrequency: suffix === "" ? "weekly" : "monthly",
        priority: suffix === "" ? 1 : 0.7,
      });
    }
  }
  return entries;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = await getRequestPublicSiteUrl();
  if (!base) return [];
  if (isPulsarCrawlHost(base.host)) return staticEntries(base, PULSAR_PATHS);
  const indexedPaths = [...INDEXED_PATHS, ANSWER_PATH] as const;

  const supabase = await createClient();
  const { data: blogTranslations } = await supabase
    .from("blog_article_translations")
    .select("locale, slug, blog_articles!inner(status, published_at)")
    .eq("blog_articles.status", "published")
    .eq("blog_articles.visibility", "public")
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

  const entries: MetadataRoute.Sitemap = staticEntries(base, indexedPaths);
  for (const locale of locales) {
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
