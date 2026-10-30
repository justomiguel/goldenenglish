import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { readRequestSupabasePublicEnv } from "@/lib/supabase/requestPublicEnv";
import { blogMediaPublicUrl } from "@/lib/blog/blogMedia";
import { loadPublishedArticles } from "@/lib/blog/server";
import { BlogIndexSurfaceEntry } from "@/components/organisms/BlogIndexSurfaceEntry";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function BlogSearchPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const search = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [dict, list, { url: supabaseUrl }] = await Promise.all([
    getDictionary(locale),
    loadPublishedArticles(supabase, {
      locale: locale as "en" | "es" | "pt",
      page: Number.parseInt(search.page ?? "1", 10) || 1,
      pageSize: 12,
      query: search.q ?? "",
      includeMembers: Boolean(user),
    }),
    readRequestSupabasePublicEnv(),
  ]);
  const rows = supabaseUrl.trim()
    ? list.rows.map((row) =>
        row.coverStoragePath
          ? { ...row, coverStoragePath: blogMediaPublicUrl(supabaseUrl, row.coverStoragePath) }
          : row,
      )
    : list.rows;
  return <BlogIndexSurfaceEntry locale={locale} rows={rows} labels={dict.blog.list} />;
}
