import type { BlogLocale } from "@/lib/blog/domain";

export type BlogSlugMatchRow = {
  article_id: string;
  locale: BlogLocale;
};

/**
 * Resolves which article owns a slug when locale+slug lookup misses (language switcher
 * keeps the previous locale's slug in the URL).
 */
export function resolveArticleIdFromSlugMatches(
  matches: BlogSlugMatchRow[],
  requestedLocale: BlogLocale,
): string | null {
  if (matches.length === 0) return null;
  if (matches.length === 1) return matches[0].article_id;

  const foreignSlugOwner = matches.find((row) => row.locale !== requestedLocale);
  return (foreignSlugOwner ?? matches[0]).article_id;
}
