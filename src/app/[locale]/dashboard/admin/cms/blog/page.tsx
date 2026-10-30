import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { assertBlogAuthor } from "@/lib/dashboard/assertBlogAuthor";
import {
  ADMIN_SESSION_FORBIDDEN,
  ADMIN_SESSION_UNAUTHORIZED,
} from "@/lib/dashboard/adminSessionErrors";
import { loadAdminArticles, loadBlogAdminStats, loadBlogHubSettings } from "@/lib/blog/server";
import { canDeleteArticle, canReviewArticles } from "@/lib/blog/permissions";
import { BlogHub } from "@/components/dashboard/admin/cms/blog/BlogHub";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function AdminBlogPage({ params }: PageProps) {
  const { locale } = await params;
  let supabase: Awaited<ReturnType<typeof assertBlogAuthor>>["supabase"];
  let role: Awaited<ReturnType<typeof assertBlogAuthor>>["role"];
  try {
    ({ supabase, role } = await assertBlogAuthor());
  } catch (error) {
    const message = (error as Error)?.message;
    if (message === ADMIN_SESSION_UNAUTHORIZED) redirect(`/${locale}/login`);
    if (message === ADMIN_SESSION_FORBIDDEN) redirect(`/${locale}/dashboard`);
    throw error;
  }

  const dict = await getDictionary(locale);
  const blog = dict.admin.cms.blog;
  const canConfigure = canReviewArticles(role);
  const list = await loadAdminArticles(supabase, {
    locale: locale as "en" | "es" | "pt",
    page: 1,
    pageSize: 24,
  });
  const settings = canConfigure ? await loadBlogHubSettings() : null;
  const stats = canConfigure
    ? await loadBlogAdminStats(supabase, locale as "en" | "es" | "pt")
    : null;

  return (
    <BlogHub
      locale={locale}
      canConfigure={canConfigure}
      rows={list.rows}
      canDelete={canDeleteArticle(role)}
      listLabels={blog.list}
      hubLabels={blog.hub}
      config={
        settings
          ? {
              ...settings,
              labels: blog.config,
            }
          : null
      }
      stats={
        stats
          ? {
              locale,
              reading: stats.reading,
              listToArticle: stats.listToArticle,
              ctaRate: stats.ctaRate,
              commentRate: stats.commentRate,
              rows: stats.rows,
              labels: blog.stats,
            }
          : null
      }
    />
  );
}
