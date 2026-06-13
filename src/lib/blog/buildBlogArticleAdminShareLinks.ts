import { BLOG_LOCALES, type BlogArticleStatus, type BlogLocale } from "@/lib/blog/domain";
import { buildBlogArticleLocalePaths } from "@/lib/blog/buildBlogArticleLocalePaths";

export type BlogArticleShareLinkKind = "public" | "preview";

export interface BlogArticleAdminShareLinkPath {
  locale: BlogLocale;
  pathname: string;
  kind: BlogArticleShareLinkKind;
}

/** Relative public or preview paths for admin copy/share UI. */
export function buildBlogArticleAdminShareLinkPaths(input: {
  articleId: string;
  status: BlogArticleStatus;
  slugsByLocale: Partial<Record<BlogLocale, string>>;
  previewToken?: string | null;
}): BlogArticleAdminShareLinkPath[] {
  const paths: BlogArticleAdminShareLinkPath[] = [];
  const isPublished = input.status === "published";

  if (isPublished) {
    const publicPaths = buildBlogArticleLocalePaths(input.slugsByLocale);
    for (const locale of BLOG_LOCALES) {
      const pathname = publicPaths[locale];
      if (pathname) {
        paths.push({ locale, pathname, kind: "public" });
      }
    }
    return paths;
  }

  const token = input.previewToken?.trim();
  if (!token) return paths;

  const localesWithContent = BLOG_LOCALES.filter((locale) => input.slugsByLocale[locale]?.trim());
  for (const locale of localesWithContent) {
    paths.push({
      locale,
      pathname: `/${locale}/blog/preview/${token}`,
      kind: "preview",
    });
  }

  return paths;
}
