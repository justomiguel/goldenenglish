export function resolveBlogArticleListIsoDate(article: {
  publishedAt: string | null;
  createdAt: string;
}): string {
  return article.publishedAt ?? article.createdAt;
}

export function formatBlogArticleListDate(
  article: { publishedAt: string | null; createdAt: string },
  locale: string,
): string {
  const iso = resolveBlogArticleListIsoDate(article);
  const date = new Date(iso);
  if (Number.isNaN(date.valueOf())) return "";
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(date);
}

export function formatBlogArticleViewCountLabel(
  viewCount: number,
  locale: string,
  template: string,
): string {
  const formatted = new Intl.NumberFormat(locale).format(viewCount);
  return template.replace(/\{\{count\}\}/g, formatted);
}
