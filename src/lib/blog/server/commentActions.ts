import type { SupabaseClient } from "@supabase/supabase-js";
import { sanitizeCommentText } from "@/lib/blog/comments/sanitizeCommentText";
import { commentCreateSchema } from "@/lib/blog/schemas";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

type StaffRole = "admin" | "assistant" | "teacher";

export async function createCommentAction(
  supabase: SupabaseClient,
  input: { actorId: string; payload: unknown },
): Promise<{ ok: boolean; code?: string }> {
  const parsed = commentCreateSchema.safeParse(input.payload);
  if (!parsed.success) return { ok: false, code: "invalid_input" };

  const bodyText = sanitizeCommentText(parsed.data.bodyText);
  if (!bodyText) return { ok: false, code: "empty_comment" };

  const { error } = await supabase.from("blog_article_comments").insert({
    article_id: parsed.data.articleId,
    parent_comment_id: parsed.data.parentCommentId ?? null,
    author_id: input.actorId,
    body_text: bodyText,
    status: "visible",
  });
  if (error) {
    logSupabaseClientError("blog.comment.create", error, { articleId: parsed.data.articleId });
    return { ok: false, code: "insert_failed" };
  }
  await supabase.from("user_events").insert({
    user_id: input.actorId,
    event_type: "action",
    entity: "section:blog",
    metadata: {
      kind: "comment_create",
      articleId: parsed.data.articleId,
      parentCommentId: parsed.data.parentCommentId ?? null,
    },
  });
  return { ok: true };
}

export async function editCommentAction(
  supabase: SupabaseClient,
  input: { commentId: string; actorId: string; bodyText: string },
): Promise<{ ok: boolean; code?: string }> {
  const bodyText = sanitizeCommentText(input.bodyText);
  if (!bodyText) return { ok: false, code: "empty_comment" };

  const { error } = await supabase
    .from("blog_article_comments")
    .update({ body_text: bodyText })
    .eq("id", input.commentId)
    .eq("author_id", input.actorId);
  if (error) {
    logSupabaseClientError("blog.comment.edit", error, { commentId: input.commentId });
    return { ok: false, code: "update_failed" };
  }
  await supabase.from("user_events").insert({
    user_id: input.actorId,
    event_type: "action",
    entity: "section:blog",
    metadata: { kind: "comment_edit", commentId: input.commentId },
  });
  return { ok: true };
}

export async function flagCommentAction(
  supabase: SupabaseClient,
  input: { commentId: string; reporterId: string; reason?: string },
): Promise<{ ok: boolean; code?: string }> {
  const { error: reportError } = await supabase.from("blog_comment_reports").insert({
    comment_id: input.commentId,
    reporter_id: input.reporterId,
    reason: input.reason ?? null,
  });
  if (reportError) {
    logSupabaseClientError("blog.comment.flag.insert_report", reportError, {
      commentId: input.commentId,
    });
    return { ok: false, code: "report_failed" };
  }

  const { error } = await supabase
    .from("blog_article_comments")
    .update({ status: "flagged" })
    .eq("id", input.commentId);
  if (error) {
    logSupabaseClientError("blog.comment.flag", error, { commentId: input.commentId });
    return { ok: false, code: "update_failed" };
  }
  return { ok: true };
}

export async function moderateCommentAction(
  supabase: SupabaseClient,
  input: {
    commentId: string;
    actorRole: StaffRole;
    status: "visible" | "hidden" | "flagged";
  },
): Promise<{ ok: boolean; code?: string }> {
  if (input.actorRole === "teacher") return { ok: false, code: "forbidden" };

  const { error } = await supabase
    .from("blog_article_comments")
    .update({ status: input.status })
    .eq("id", input.commentId);
  if (error) {
    logSupabaseClientError("blog.comment.moderate", error, { commentId: input.commentId });
    return { ok: false, code: "update_failed" };
  }

  if (input.actorRole === "admin") {
    await recordSystemAudit({
      action: "blog.comment.moderate",
      resourceType: "blog_comment",
      resourceId: input.commentId,
      payload: { status: input.status },
    });
  }
  return { ok: true };
}
