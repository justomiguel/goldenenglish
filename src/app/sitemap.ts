import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n/dictionaries";
import { getPublicSiteUrl } from "@/lib/site/publicUrl";

/** Public marketing + auth entry; admin/dashboard excluded (noindex elsewhere). */
const INDEXED_PATHS = ["", "/login"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getPublicSiteUrl();
  if (!base) return [];

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
  }
  return entries;
}
