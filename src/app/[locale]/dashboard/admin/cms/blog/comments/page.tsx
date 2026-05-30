import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { assertBlogAuthor } from "@/lib/dashboard/assertBlogAuthor";
import {
  ADMIN_SESSION_FORBIDDEN,
  ADMIN_SESSION_UNAUTHORIZED,
} from "@/lib/dashboard/adminSessionErrors";
import { mapCommentRow } from "@/lib/blog/server";
import { BlogCommentsModeration } from "@/components/dashboard/admin/cms/blog/BlogCommentsModeration";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function AdminBlogCommentsPage({ params }: PageProps) {
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

  const { data } = await supabase
    .from("blog_article_comments")
    .select("id, article_id, author_id, parent_comment_id, body_text, status, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(50);
  const dict = await getDictionary(locale);

  return (
    <BlogCommentsModeration
      comments={(data ?? []).map((row) => mapCommentRow(row))}
      labels={dict.admin.cms.blog.comments}
    />
  );
}
