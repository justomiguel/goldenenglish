"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import type { BlogArticleComment } from "@/lib/blog/domain";

interface UseBlogCommentsResult {
  comments: BlogArticleComment[];
  isLoading: boolean;
  error: string | null;
  createComment: (bodyText: string, parentCommentId?: string | null) => Promise<boolean>;
  reportComment: (commentId: string, reason?: string) => Promise<boolean>;
}

const client = createClient();

async function fetchComments(articleId: string): Promise<BlogArticleComment[]> {
  const { data, error } = await client
    .from("blog_article_comments")
    .select("id, article_id, author_id, parent_comment_id, body_text, status, created_at, updated_at")
    .eq("article_id", articleId)
    .eq("status", "visible")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    articleId: row.article_id,
    authorId: row.author_id,
    parentCommentId: row.parent_comment_id,
    bodyText: row.body_text,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export function useBlogComments(articleId: string): UseBlogCommentsResult {
  const { data, error, mutate, isLoading } = useSWR(
    articleId ? ["blog-comments", articleId] : null,
    () => fetchComments(articleId),
  );

  const createComment = useCallback(
    async (bodyText: string, parentCommentId?: string | null): Promise<boolean> => {
      const {
        data: { user },
      } = await client.auth.getUser();
      if (!user) return false;
      const { error } = await client.from("blog_article_comments").insert({
        article_id: articleId,
        author_id: user.id,
        parent_comment_id: parentCommentId ?? null,
        body_text: bodyText.trim(),
        status: "visible",
      });
      if (error) return false;
      await mutate();
      return true;
    },
    [articleId, mutate],
  );

  const reportComment = useCallback(
    async (commentId: string, reason?: string): Promise<boolean> => {
      const {
        data: { user },
      } = await client.auth.getUser();
      if (!user) return false;

      const { error: reportError } = await client.from("blog_comment_reports").insert({
        comment_id: commentId,
        reporter_id: user.id,
        reason: reason ?? null,
      });
      if (reportError) return false;
      await client.from("blog_article_comments").update({ status: "flagged" }).eq("id", commentId);
      await mutate();
      return true;
    },
    [mutate],
  );

  return {
    comments: data ?? [],
    isLoading,
    error: error ? "load_failed" : null,
    createComment,
    reportComment,
  };
}
