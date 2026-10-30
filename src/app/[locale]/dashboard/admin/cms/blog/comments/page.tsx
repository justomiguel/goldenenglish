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
    .select("id, article_id, author_id, guest_display_name, parent_comment_id, body_text, status, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(50);
  const rows = (data ?? []).map((row) => mapCommentRow(row));
  const ids = rows.map((row) => row.id);
  const { data: emails } =
    ids.length === 0
      ? { data: [] }
      : await supabase
          .from("blog_comment_guest_emails")
          .select("comment_id, email")
          .in("comment_id", ids);
  const emailByComment = new Map((emails ?? []).map((row) => [row.comment_id, row.email]));
  const dict = await getDictionary(locale);

  return (
    <BlogCommentsModeration
      comments={rows.map((row) => ({
        ...row,
        guestEmail: emailByComment.get(row.id) ?? null,
      }))}
      labels={dict.admin.cms.blog.comments}
    />
  );
}
