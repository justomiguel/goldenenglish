import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { commentInsertKind } from "@/lib/blog/commentEligibility";
import type { BlogVisibility } from "@/lib/blog/articleVisibility";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

const emailSchema = z.string().trim().email().max(320);

export async function createGuestComment(
  admin: SupabaseClient,
  input: {
    articleId: string;
    bodyText: string;
    displayName: string;
    email: string;
    commentsGloballyEnabled: boolean;
    guestCommentsEnabled: boolean;
    articleCommentsEnabled: boolean;
    visibility: BlogVisibility;
  },
): Promise<{ ok: true } | { ok: false; code: "denied" | "invalid_email" | "invalid_name" }> {
  const displayName = input.displayName.trim();
  if (!displayName) return { ok: false, code: "invalid_name" };
  if (!emailSchema.safeParse(input.email).success) {
    return { ok: false, code: "invalid_email" };
  }
  const bodyText = input.bodyText.trim();
  if (!bodyText) return { ok: false, code: "denied" };

  const kind = commentInsertKind({
    commentsGloballyEnabled: input.commentsGloballyEnabled,
    guestCommentsEnabled: input.guestCommentsEnabled,
    articleCommentsEnabled: input.articleCommentsEnabled,
    visibility: input.visibility,
    isSignedIn: false,
  });
  if (kind !== "guest_pending") return { ok: false, code: "denied" };

  const { data: comment, error: commentError } = await admin
    .from("blog_article_comments")
    .insert({
      article_id: input.articleId,
      author_id: null,
      guest_display_name: displayName,
      body_text: bodyText,
      status: "pending",
    })
    .select("id")
    .single();

  if (commentError || !comment?.id) {
    logSupabaseClientError("blog.createGuestComment", commentError, { articleId: input.articleId });
    return { ok: false, code: "denied" };
  }

  const { error: emailError } = await admin.from("blog_comment_guest_emails").insert({
    comment_id: comment.id,
    email: input.email.trim(),
  });
  if (emailError) {
    logSupabaseClientError("blog.createGuestComment.email", emailError, {
      articleId: input.articleId,
    });
    return { ok: false, code: "denied" };
  }

  return { ok: true };
}
