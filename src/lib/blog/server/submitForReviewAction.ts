import type { SupabaseClient } from "@supabase/supabase-js";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

export async function submitForReviewAction(
  supabase: SupabaseClient,
  input: {
    articleId: string;
    actorRole: "admin" | "assistant" | "teacher";
    actorId?: string;
  },
): Promise<{ ok: boolean; code?: string }> {
  if (input.actorRole !== "teacher") return { ok: false, code: "forbidden" };

  const { error } = await supabase
    .from("blog_articles")
    .update({ status: "pending_review" })
    .eq("id", input.articleId);
  if (error) {
    logSupabaseClientError("blog.submit_for_review", error, { articleId: input.articleId });
    return { ok: false, code: "update_failed" };
  }

  if (input.actorId) {
    await supabase.from("user_events").insert({
      user_id: input.actorId,
      event_type: "action",
      entity: "section:blog",
      metadata: { kind: "article_submit_for_review", articleId: input.articleId },
    });
  }

  return { ok: true };
}

export async function publishArticleAction(
  supabase: SupabaseClient,
  input: {
    articleId: string;
    actorRole: "admin" | "assistant" | "teacher";
    actorId?: string;
  },
): Promise<{ ok: boolean; code?: string }> {
  if (input.actorRole === "teacher") return { ok: false, code: "forbidden" };

  const nowIso = new Date().toISOString();
  const { error } = await supabase
    .from("blog_articles")
    .update({ status: "published", published_at: nowIso })
    .eq("id", input.articleId);
  if (error) {
    logSupabaseClientError("blog.publish", error, { articleId: input.articleId });
    return { ok: false, code: "publish_failed" };
  }

  if (input.actorRole === "admin") {
    await recordSystemAudit({
      action: "blog.publish",
      resourceType: "blog_article",
      resourceId: input.articleId,
      payload: { publishedAt: nowIso },
    });
  }
  if (input.actorId) {
    await supabase.from("user_events").insert({
      user_id: input.actorId,
      event_type: "action",
      entity: "section:blog",
      metadata: { kind: "article_publish", articleId: input.articleId },
    });
  }

  return { ok: true };
}

export async function archiveArticleAction(
  supabase: SupabaseClient,
  input: {
    articleId: string;
    actorRole: "admin" | "assistant" | "teacher";
    actorId?: string;
  },
): Promise<{ ok: boolean; code?: string }> {
  if (input.actorRole === "teacher") return { ok: false, code: "forbidden" };

  const { error } = await supabase
    .from("blog_articles")
    .update({ status: "archived" })
    .eq("id", input.articleId);
  if (error) {
    logSupabaseClientError("blog.archive", error, { articleId: input.articleId });
    return { ok: false, code: "archive_failed" };
  }

  if (input.actorRole === "admin") {
    await recordSystemAudit({
      action: "blog.archive",
      resourceType: "blog_article",
      resourceId: input.articleId,
      payload: {},
    });
  }
  if (input.actorId) {
    await supabase.from("user_events").insert({
      user_id: input.actorId,
      event_type: "action",
      entity: "section:blog",
      metadata: { kind: "article_archive", articleId: input.articleId },
    });
  }

  return { ok: true };
}

export async function pinArticleAction(
  supabase: SupabaseClient,
  input: {
    articleId: string;
    isPinned: boolean;
    actorRole: "admin" | "assistant" | "teacher";
    actorId?: string;
  },
): Promise<{ ok: boolean; code?: string }> {
  if (input.actorRole === "teacher") return { ok: false, code: "forbidden" };

  const { error } = await supabase
    .from("blog_articles")
    .update({
      is_pinned: input.isPinned,
      pinned_at: input.isPinned ? new Date().toISOString() : null,
    })
    .eq("id", input.articleId);
  if (error) {
    logSupabaseClientError("blog.pin", error, { articleId: input.articleId });
    return { ok: false, code: "pin_failed" };
  }

  if (input.actorRole === "admin") {
    await recordSystemAudit({
      action: input.isPinned ? "blog.pin" : "blog.unpin",
      resourceType: "blog_article",
      resourceId: input.articleId,
      payload: { isPinned: input.isPinned },
    });
  }
  if (input.actorId) {
    await supabase.from("user_events").insert({
      user_id: input.actorId,
      event_type: "action",
      entity: "section:blog",
      metadata: {
        kind: input.isPinned ? "article_pin" : "article_unpin",
        articleId: input.articleId,
      },
    });
  }

  return { ok: true };
}
