import {
  buildBlogArticleAdminShareLinkPaths,
  type BlogArticleAdminShareLinkPath,
} from "@/lib/blog/buildBlogArticleAdminShareLinks";
import { createBlogPreviewToken } from "@/lib/blog/previewToken";
import type { BlogArticleStatus, BlogLocale } from "@/lib/blog/domain";
import { absoluteUrl } from "@/lib/site/publicUrl";

export interface BlogArticleAdminShareLink {
  locale: BlogLocale;
  pathname: string;
  url: string;
  kind: BlogArticleAdminShareLinkPath["kind"];
}

function toAbsoluteShareUrl(pathname: string): string {
  return absoluteUrl(pathname)?.href ?? pathname;
}

export function resolveBlogArticleAdminShareLinks(input: {
  articleId: string;
  status: BlogArticleStatus;
  slugsByLocale: Partial<Record<BlogLocale, string>>;
}): BlogArticleAdminShareLink[] {
  const previewToken =
    input.status === "published" ? null : createBlogPreviewToken(input.articleId);

  return buildBlogArticleAdminShareLinkPaths({
    articleId: input.articleId,
    status: input.status,
    slugsByLocale: input.slugsByLocale,
    previewToken,
  }).map((link) => ({
    ...link,
    url: toAbsoluteShareUrl(link.pathname),
  }));
}
