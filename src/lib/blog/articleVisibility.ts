export type BlogVisibility = "public" | "members";

export function canReadBlogArticle(input: {
  visibility: BlogVisibility;
  isSignedIn: boolean;
}): boolean {
  return input.visibility === "public" || input.isSignedIn;
}

export function membersArticleRedirectPath(input: {
  locale: string;
  slug: string;
  visibility: BlogVisibility;
  isSignedIn: boolean;
}): string | null {
  if (canReadBlogArticle({ visibility: input.visibility, isSignedIn: input.isSignedIn })) {
    return null;
  }
  const articlePath = `/${input.locale}/blog/${input.slug}`;
  return `/${input.locale}/login?next=${encodeURIComponent(articlePath)}`;
}
