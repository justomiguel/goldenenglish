import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { readRequestSupabasePublicEnv } from "@/lib/supabase/requestPublicEnv";
import { blogMediaPublicUrl } from "@/lib/blog/blogMedia";
import { loadPublishedArticles } from "@/lib/blog/server";
import { BlogIndexSurfaceEntry } from "@/components/organisms/BlogIndexSurfaceEntry";

interface PageProps {
  params: Promise<{ locale: string; tag: string }>;
}

export default async function BlogTagPage({ params }: PageProps) {
  const { locale, tag } = await params;
  const supabase = await createClient();
  const [dict, list, { url: supabaseUrl }] = await Promise.all([
    getDictionary(locale),
    loadPublishedArticles(supabase, {
      locale: locale as "en" | "es" | "pt",
      page: 1,
      pageSize: 12,
      tag,
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
