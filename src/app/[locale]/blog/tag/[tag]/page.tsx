import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { loadPublishedArticles } from "@/lib/blog/server";
import { BlogIndexSurfaceEntry } from "@/components/organisms/BlogIndexSurfaceEntry";

interface PageProps {
  params: Promise<{ locale: string; tag: string }>;
}

export default async function BlogTagPage({ params }: PageProps) {
  const { locale, tag } = await params;
  const supabase = await createClient();
  const dict = await getDictionary(locale);
  const list = await loadPublishedArticles(supabase, {
    locale: locale as "en" | "es" | "pt",
    page: 1,
    pageSize: 12,
    tag,
  });
  return <BlogIndexSurfaceEntry locale={locale} rows={list.rows} labels={dict.blog.list} />;
}
