import { BLOG_LOCALES, type BlogLocale } from "@/lib/blog/domain";
import type { AppLocale } from "@/lib/i18n/dictionaries";

/** Public blog detail URLs per locale when each translation has its own slug. */
export function buildBlogArticleLocalePaths(
  slugsByLocale: Partial<Record<BlogLocale, string>>,
): Partial<Record<AppLocale, string>> {
  const paths: Partial<Record<AppLocale, string>> = {};
  for (const loc of BLOG_LOCALES) {
    const slug = slugsByLocale[loc]?.trim();
    if (slug) paths[loc] = `/${loc}/blog/${slug}`;
  }
  return paths;
}

export function buildBlogArticleLanguageAlternates(
  slugsByLocale: Partial<Record<BlogLocale, string>>,
  defaultLocale: BlogLocale,
): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const loc of BLOG_LOCALES) {
    const slug = slugsByLocale[loc]?.trim();
    if (slug) languages[loc] = `/${loc}/blog/${slug}`;
  }
  const defaultSlug = slugsByLocale[defaultLocale]?.trim();
  if (defaultSlug) {
    languages["x-default"] = `/${defaultLocale}/blog/${defaultSlug}`;
  }
  return languages;
}
