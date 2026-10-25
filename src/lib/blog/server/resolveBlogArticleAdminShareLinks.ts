import {
  buildBlogArticleAdminShareLinkPaths,
  type BlogArticleAdminShareLinkPath,
} from "@/lib/blog/buildBlogArticleAdminShareLinks";
import { createBlogPreviewToken } from "@/lib/blog/previewToken";
import type { BlogArticleStatus, BlogLocale } from "@/lib/blog/domain";
import { absoluteUrlForRequest } from "@/lib/site/requestPublicUrl";
import { resolveRequestTenant } from "@/lib/tenant/tenantRequestContext";

export interface BlogArticleAdminShareLink {
  locale: BlogLocale;
  pathname: string;
  url: string;
  kind: BlogArticleAdminShareLinkPath["kind"];
}

async function toAbsoluteShareUrl(pathname: string): Promise<string> {
  return (await absoluteUrlForRequest(pathname))?.href ?? pathname;
}

export async function resolveBlogArticleAdminShareLinks(input: {
  articleId: string;
  status: BlogArticleStatus;
  slugsByLocale: Partial<Record<BlogLocale, string>>;
}): Promise<BlogArticleAdminShareLink[]> {
  const tenant = input.status === "published" ? null : await resolveRequestTenant();
  const previewToken =
    input.status === "published"
      ? null
      : createBlogPreviewToken(input.articleId, undefined, tenant?.slug);

  const links = buildBlogArticleAdminShareLinkPaths({
    articleId: input.articleId,
    status: input.status,
    slugsByLocale: input.slugsByLocale,
    previewToken,
  });
  return Promise.all(
    links.map(async (link) => ({
      ...link,
      url: await toAbsoluteShareUrl(link.pathname),
    })),
  );
}
