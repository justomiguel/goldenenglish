import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { assertBlogAuthor } from "@/lib/dashboard/assertBlogAuthor";
import {
  ADMIN_SESSION_FORBIDDEN,
  ADMIN_SESSION_UNAUTHORIZED,
} from "@/lib/dashboard/adminSessionErrors";
import { loadPendingReviewArticles } from "@/lib/blog/server";
import { BlogReviewQueue } from "@/components/dashboard/admin/cms/blog/BlogReviewQueue";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function AdminBlogReviewPage({ params }: PageProps) {
  const { locale } = await params;
  let supabase: Awaited<ReturnType<typeof assertBlogAuthor>>["supabase"];
  try {
    ({ supabase } = await assertBlogAuthor());
  } catch (error) {
    const message = (error as Error)?.message;
    if (message === ADMIN_SESSION_UNAUTHORIZED) redirect(`/${locale}/login`);
    if (message === ADMIN_SESSION_FORBIDDEN) redirect(`/${locale}/dashboard`);
    throw error;
  }

  const dict = await getDictionary(locale);
  const pending = await loadPendingReviewArticles(
    supabase,
    locale as "en" | "es" | "pt",
    1,
    24,
  );
  return <BlogReviewQueue locale={locale} rows={pending.rows} labels={dict.admin.cms.blog.review} />;
}
