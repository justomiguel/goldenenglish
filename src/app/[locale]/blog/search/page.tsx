import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { loadPublishedArticles } from "@/lib/blog/server";
import { BlogIndexSurfaceEntry } from "@/components/organisms/BlogIndexSurfaceEntry";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function BlogSearchPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const search = await searchParams;
  const dict = await getDictionary(locale);
  const supabase = await createClient();
  const list = await loadPublishedArticles(supabase, {
    locale: locale as "en" | "es" | "pt",
    page: Number.parseInt(search.page ?? "1", 10) || 1,
    pageSize: 12,
    query: search.q ?? "",
  });
  return <BlogIndexSurfaceEntry locale={locale} rows={list.rows} labels={dict.blog.list} />;
}
