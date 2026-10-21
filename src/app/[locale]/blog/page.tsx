import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { loadPublishedArticles } from "@/lib/blog/server";
import { BlogIndexSurfaceEntry } from "@/components/organisms/BlogIndexSurfaceEntry";
import { getBrandForRequest } from "@/lib/brand/server";
import { buildResolvedPublicShareMetadata } from "@/lib/site/buildResolvedPublicShareMetadata";

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
  const page = Number.parseInt(search.page ?? "1", 10) || 1;
  const list = await loadPublishedArticles(supabase, {
    locale: locale as "en" | "es" | "pt",
    page,
    pageSize: 12,
    query: search.q ?? "",
    tag: search.tag,
  });
  return (
    <BlogIndexSurfaceEntry locale={locale} rows={list.rows} labels={dict.blog.list} />
  );
}
