import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { blogMediaPublicUrl } from "@/lib/blog/blogMedia";
import { loadPublishedArticles, type BlogArticleListItem } from "@/lib/blog/server";
import { BlogIndexSurfaceEntry } from "@/components/organisms/BlogIndexSurfaceEntry";
import { BlogMetricBeacon } from "@/components/blog/BlogMetricBeacon";
import { getBrandForRequest } from "@/lib/brand/server";
import { buildResolvedPublicShareMetadata } from "@/lib/site/buildResolvedPublicShareMetadata";
import { readRequestSupabasePublicEnv } from "@/lib/supabase/requestPublicEnv";

function withResolvedBlogCovers(
  rows: BlogArticleListItem[],
  supabaseUrl: string,
): BlogArticleListItem[] {
  if (!supabaseUrl.trim()) return rows;
  return rows.map((row) =>
    row.coverStoragePath
      ? { ...row, coverStoragePath: blogMediaPublicUrl(supabaseUrl, row.coverStoragePath) }
      : row,
  );
}

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; q?: string; tag?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const [dict, brand] = await Promise.all([getDictionary(locale), getBrandForRequest()]);
  return buildResolvedPublicShareMetadata({
    what: dict.blog.list.title,
    academyName: brand.name,
    description: dict.blog.list.metaDescription,
    path: `/${locale}/blog`,
  });
}

export default async function BlogIndexPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const search = await searchParams;
  const dict = await getDictionary(locale);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const page = Number.parseInt(search.page ?? "1", 10) || 1;
  const [list, { url: supabaseUrl }] = await Promise.all([
    loadPublishedArticles(supabase, {
      locale: locale as "en" | "es" | "pt",
      page,
      pageSize: 12,
      query: search.q ?? "",
      tag: search.tag,
      includeMembers: Boolean(user),
    }),
    readRequestSupabasePublicEnv(),
  ]);
  return (
    <>
      <BlogMetricBeacon kind="list_view" locale={locale} />
      <BlogIndexSurfaceEntry
        locale={locale}
        rows={withResolvedBlogCovers(list.rows, supabaseUrl)}
        labels={dict.blog.list}
      />
    </>
  );
}
