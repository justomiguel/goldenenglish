"use server";

import { revalidatePath } from "next/cache";
import { assertBlogAuthor } from "@/lib/dashboard/assertBlogAuthor";
import {
  archiveArticleAction,
  createCommentAction,
  deleteArticleAction,
  editCommentAction,
  flagCommentAction,
  moderateCommentAction,
  pinArticleAction,
  publishArticleAction,
  saveArticleAction,
  submitForReviewAction,
} from "@/lib/blog/server";
import {
  ADMIN_SESSION_FORBIDDEN,
  ADMIN_SESSION_UNAUTHORIZED,
} from "@/lib/dashboard/adminSessionErrors";
import { logServerAuthzDenied } from "@/lib/logging/serverActionLog";
import {
  prepareBlogMediaFileUpload,
  removeBlogMediaStoragePath,
} from "@/lib/blog/server/prepareBlogMediaFileUpload";
import { z } from "zod";

function revalidateBlogPaths(locale: string) {
  revalidatePath(`/${locale}/blog`);
  revalidatePath(`/${locale}/dashboard/admin/cms/blog`);
}

export async function saveBlogArticleAdminAction(input: {
  locale: string;
  articleId?: string;
  payload: unknown;
}) {
  try {
    const { supabase, user, role } = await assertBlogAuthor();
    const result = await saveArticleAction(supabase, {
      articleId: input.articleId,
      actorId: user.id,
      actorRole: role,
      payload: input.payload,
    });
    if (result.ok) revalidateBlogPaths(input.locale);
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === ADMIN_SESSION_UNAUTHORIZED || message === ADMIN_SESSION_FORBIDDEN) {
      logServerAuthzDenied("saveBlogArticleAdminAction");
    }
    return { ok: false, code: "unauthorized" };
  }
}

export async function submitBlogForReviewAdminAction(locale: string, articleId: string) {
  const { supabase, role, user } = await assertBlogAuthor();
  const result = await submitForReviewAction(supabase, {
    articleId,
    actorRole: role,
    actorId: user.id,
  });
  if (result.ok) revalidateBlogPaths(locale);
  return result;
}

export async function publishBlogArticleAdminAction(locale: string, articleId: string) {
  const { supabase, role, user } = await assertBlogAuthor();
  const result = await publishArticleAction(supabase, {
    articleId,
    actorRole: role,
    actorId: user.id,
  });
  if (result.ok) revalidateBlogPaths(locale);
  return result;
}

export async function archiveBlogArticleAdminAction(locale: string, articleId: string) {
  const { supabase, role, user } = await assertBlogAuthor();
  const result = await archiveArticleAction(supabase, {
    articleId,
    actorRole: role,
    actorId: user.id,
  });
  if (result.ok) revalidateBlogPaths(locale);
  return result;
}

export async function deleteBlogArticleAdminAction(locale: string, articleId: string) {
  try {
    const { supabase, role, user } = await assertBlogAuthor();
    const result = await deleteArticleAction(supabase, {
      articleId,
      actorRole: role,
      actorId: user.id,
    });
    if (result.ok) revalidateBlogPaths(locale);
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === ADMIN_SESSION_UNAUTHORIZED || message === ADMIN_SESSION_FORBIDDEN) {
      logServerAuthzDenied("deleteBlogArticleAdminAction");
    }
    return { ok: false as const, code: "unauthorized" as const };
  }
}

export async function pinBlogArticleAdminAction(
  locale: string,
  articleId: string,
  isPinned: boolean,
) {
  const { supabase, role, user } = await assertBlogAuthor();
  const result = await pinArticleAction(supabase, {
    articleId,
    isPinned,
    actorRole: role,
    actorId: user.id,
  });
  if (result.ok) revalidateBlogPaths(locale);
  return result;
}

export async function createBlogCommentAdminAction(payload: unknown) {
  const { supabase, user } = await assertBlogAuthor();
  return createCommentAction(supabase, { actorId: user.id, payload });
}

export async function editBlogCommentAdminAction(commentId: string, bodyText: string) {
  const { supabase, user } = await assertBlogAuthor();
  return editCommentAction(supabase, { commentId, actorId: user.id, bodyText });
}

export async function flagBlogCommentAdminAction(commentId: string, reason?: string) {
  const { supabase, user } = await assertBlogAuthor();
  return flagCommentAction(supabase, { commentId, reporterId: user.id, reason });
}

export async function moderateBlogCommentAdminAction(
  commentId: string,
  status: "visible" | "hidden" | "flagged",
) {
  const { supabase, role } = await assertBlogAuthor();
  return moderateCommentAction(supabase, { commentId, actorRole: role, status });
}

export async function prepareBlogMediaFileUploadAction(raw: unknown) {
  try {
    const { supabase, user } = await assertBlogAuthor();
    return prepareBlogMediaFileUpload(supabase, user.id, raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === ADMIN_SESSION_UNAUTHORIZED || message === ADMIN_SESSION_FORBIDDEN) {
      logServerAuthzDenied("prepareBlogMediaFileUploadAction");
    }
    return { ok: false as const, code: "forbidden" as const };
  }
}

const CleanupUploadSchema = z.object({
  storagePath: z.string().trim().min(1).max(500),
});

export async function cleanupBlogMediaPendingUploadAction(raw: unknown) {
  const parsed = CleanupUploadSchema.safeParse(raw);
  if (!parsed.success) return { ok: false as const };
  try {
    const { supabase } = await assertBlogAuthor();
    await removeBlogMediaStoragePath(supabase, parsed.data.storagePath);
    return { ok: true as const };
  } catch {
    return { ok: false as const };
  }
}
