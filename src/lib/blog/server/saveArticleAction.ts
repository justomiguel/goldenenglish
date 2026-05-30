import type { SupabaseClient } from "@supabase/supabase-js";
import { articleCreateInputSchema } from "@/lib/blog/schemas";
import { htmlToPlain } from "@/lib/blog/htmlToPlain";
import { canWriteArticle } from "@/lib/blog/permissions";
import { calculateReadingTimeMinutes } from "@/lib/blog/readingTime";
import { sanitizeBlogHtml } from "@/lib/blog/sanitizeBlogHtml";
import { blogAttachmentsSchema } from "@/lib/blog/attachments";
import { normalizeTags } from "@/lib/blog/tags";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import {
  logServerActionException,
  logServerWarn,
  logSupabaseClientError,
} from "@/lib/logging/serverActionLog";

export interface SaveArticleActionInput {
  articleId?: string;
  actorId: string;
  actorRole: "admin" | "assistant" | "teacher";
  payload: unknown;
}

export async function saveArticleAction(
  supabase: SupabaseClient,
  input: SaveArticleActionInput,
): Promise<{ ok: boolean; articleId?: string; code?: string }> {
  const parsed = articleCreateInputSchema.safeParse(input.payload);
  if (!parsed.success) return { ok: false, code: "invalid_input" };

  const normalizedPayload = parsed.data;
  const normalizedTags = normalizeTags(normalizedPayload.tags);

  try {
    let existingStatus: "draft" | "pending_review" | "scheduled" | "published" | "archived" =
      "draft";
    let authorIdForRow = input.actorId;

    if (input.articleId) {
      const { data: existing, error } = await supabase
        .from("blog_articles")
        .select("author_id, status")
        .eq("id", input.articleId)
        .maybeSingle();
      if (error) {
        logSupabaseClientError("blog.save.fetch_existing", error, { articleId: input.articleId });
        return { ok: false, code: "fetch_failed" };
      }
      if (!existing?.author_id) return { ok: false, code: "article_not_found" };
      authorIdForRow = existing.author_id;
      existingStatus = existing.status;

      if (
        !canWriteArticle({
          actorId: input.actorId,
          actorRole: input.actorRole,
          authorId: existing.author_id,
          nextStatus: normalizedPayload.status,
        })
      ) {
        return { ok: false, code: "forbidden" };
      }
    }

    const rowInput = {
      default_locale: normalizedPayload.defaultLocale,
      status: normalizedPayload.status,
      scheduled_for: normalizedPayload.scheduledFor ?? null,
      cover_storage_path: normalizedPayload.coverStoragePath ?? null,
      tags: normalizedTags,
      comments_enabled: normalizedPayload.commentsEnabled,
      is_pinned: normalizedPayload.isPinned,
      updated_by: input.actorId,
      ...(normalizedPayload.status === "published"
        ? { published_at: new Date().toISOString() }
        : {}),
    };

    const articleUpsertRow = {
      ...rowInput,
      author_id: authorIdForRow,
      ...(input.articleId ? { id: input.articleId } : {}),
    };

    const { data: articleRow, error: articleError } = await supabase
      .from("blog_articles")
      .upsert(articleUpsertRow, { onConflict: "id" })
      .select("id")
      .single();

    if (articleError || !articleRow?.id) {
      logSupabaseClientError("blog.save.upsert_article", articleError, {
        actorRole: input.actorRole,
      });
      return { ok: false, code: "upsert_failed" };
    }

    const translationRows = normalizedPayload.translations.map((translation) => {
      const bodyHtml = sanitizeBlogHtml(translation.bodyHtml);
      const bodyTextPlain = htmlToPlain(bodyHtml);
      const attachments = blogAttachmentsSchema.parse(translation.attachments ?? []);
      return {
        article_id: articleRow.id,
        locale: translation.locale,
        slug: translation.slug,
        title: translation.title.trim(),
        excerpt: translation.excerpt.trim(),
        body_html: bodyHtml,
        body_text_plain: bodyTextPlain,
        reading_time_minutes: calculateReadingTimeMinutes(bodyTextPlain),
        attachments,
        seo_title: translation.seoTitle ?? null,
        seo_description: translation.seoDescription ?? null,
      };
    });

    const { error: translationsError } = await supabase
      .from("blog_article_translations")
      .upsert(translationRows, { onConflict: "article_id,locale" });

    if (translationsError) {
      logSupabaseClientError("blog.save.upsert_translations", translationsError, {
        articleId: articleRow.id,
      });
      return { ok: false, code: "translations_failed" };
    }

    if (input.actorRole === "admin" && existingStatus !== normalizedPayload.status) {
      await recordSystemAudit({
        action: "blog.status_change",
        resourceType: "blog_article",
        resourceId: articleRow.id,
        payload: {
          previousStatus: existingStatus,
          nextStatus: normalizedPayload.status,
        },
      });
    } else if (existingStatus !== normalizedPayload.status) {
      logServerWarn("blog.save.audit_skipped_non_admin", {
        actorRole: input.actorRole,
        articleId: articleRow.id,
      });
    }

    return { ok: true, articleId: articleRow.id };
  } catch (error) {
    logServerActionException("blog.save.unhandled", error, {
      actorRole: input.actorRole,
    });
    return { ok: false, code: "unexpected_error" };
  }
}
