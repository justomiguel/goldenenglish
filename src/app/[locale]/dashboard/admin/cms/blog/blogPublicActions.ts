"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertBlogAuthor } from "@/lib/dashboard/assertBlogAuthor";
import { canReviewArticles } from "@/lib/blog/permissions";
import { createGuestComment } from "@/lib/blog/server/createGuestComment";
import { loadBlogHubSettings } from "@/lib/blog/server/loadBlogHubSettings";
import { saveBlogSettings } from "@/lib/blog/server/saveBlogSettings";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  ADMIN_SESSION_FORBIDDEN,
  ADMIN_SESSION_UNAUTHORIZED,
} from "@/lib/dashboard/adminSessionErrors";
import { logServerAuthzDenied, logServerException } from "@/lib/logging/serverActionLog";

const guestSchema = z.object({
  locale: z.string().min(2).max(8),
  articleId: z.string().uuid(),
  displayName: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(320),
  bodyText: z.string().trim().min(1).max(2000),
});

export async function saveBlogSettingsAction(input: {
  locale: string;
  blogEnabled: boolean;
  commentsEnabled: boolean;
  guestCommentsEnabled: boolean;
}) {
  try {
    const { supabase, user, role } = await assertBlogAuthor();
    return saveBlogSettings(supabase, {
      actorId: user.id,
      canConfigure: canReviewArticles(role),
      locale: input.locale,
      blogEnabled: input.blogEnabled,
      commentsEnabled: input.commentsEnabled,
      guestCommentsEnabled: input.guestCommentsEnabled,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === ADMIN_SESSION_UNAUTHORIZED || message === ADMIN_SESSION_FORBIDDEN) {
      logServerAuthzDenied("blog.saveSettings");
    } else {
      logServerException("blog.saveSettings", error);
    }
    return { ok: false as const, code: "forbidden" as const };
  }
}

export async function createGuestBlogCommentAction(raw: unknown) {
  const parsed = guestSchema.safeParse(raw);
  if (!parsed.success) return { ok: false as const, code: "invalid_name" as const };

  try {
    const admin = await createAdminClient();
    const { data: article } = await admin
      .from("blog_articles")
      .select("id, visibility, comments_enabled, status")
      .eq("id", parsed.data.articleId)
      .maybeSingle();
    if (!article || article.status !== "published") {
      return { ok: false as const, code: "denied" as const };
    }

    const settings = await loadBlogHubSettings();
    const result = await createGuestComment(admin, {
      articleId: parsed.data.articleId,
      bodyText: parsed.data.bodyText,
      displayName: parsed.data.displayName,
      email: parsed.data.email,
      commentsGloballyEnabled: settings.commentsEnabled,
      guestCommentsEnabled: settings.guestCommentsEnabled,
      articleCommentsEnabled: Boolean(article.comments_enabled),
      visibility: article.visibility === "members" ? "members" : "public",
    });
    if (result.ok) revalidatePath(`/${parsed.data.locale}/blog`);
    return result;
  } catch (error) {
    logServerException("blog.createGuestComment", error, { articleId: parsed.data.articleId });
    return { ok: false as const, code: "denied" as const };
  }
}
