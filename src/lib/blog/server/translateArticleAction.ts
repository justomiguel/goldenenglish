import type { SupabaseClient } from "@supabase/supabase-js";
import type { BlogLocale } from "@/lib/blog/domain";
import { sanitizeBlogHtml } from "@/lib/blog/sanitizeBlogHtml";
import { htmlToPlain } from "@/lib/blog/htmlToPlain";
import { translateTipTapJson } from "@/lib/blog/translate/translateTipTapJson";
import type { BlogTranslateResult } from "@/lib/blog/translate/googleTranslateTypes";
import { logServerActionException, logSupabaseClientError } from "@/lib/logging/serverActionLog";

export interface TranslateArticleDeps {
  translateHtml: (input: {
    sourceLocale: BlogLocale;
    targetLocale: BlogLocale;
    html: string;
  }) => Promise<BlogTranslateResult>;
}

export async function translateArticleAction(
  supabase: SupabaseClient,
  deps: TranslateArticleDeps,
  input: {
    articleId: string;
    sourceLocale: BlogLocale;
    targetLocale: BlogLocale;
    tipTapDoc: Record<string, unknown>;
    actorId?: string;
  },
): Promise<{ ok: boolean; translatedDoc?: Record<string, unknown>; code?: string }> {
  try {
    const { data: article, error } = await supabase
      .from("blog_articles")
      .select("id")
      .eq("id", input.articleId)
      .maybeSingle();
    if (error) {
      logSupabaseClientError("blog.translate.fetch_article", error, { articleId: input.articleId });
      return { ok: false, code: "article_lookup_failed" };
    }
    if (!article) return { ok: false, code: "article_not_found" };

    const translated = await translateTipTapJson(input.tipTapDoc, async (text) => {
      if (!text.trim()) return text;
      const result = await deps.translateHtml({
        sourceLocale: input.sourceLocale,
        targetLocale: input.targetLocale,
        html: text,
      });
      return htmlToPlain(sanitizeBlogHtml(result.translatedHtml));
    });

    if (input.actorId) {
      await supabase.from("user_events").insert({
        user_id: input.actorId,
        event_type: "action",
        entity: "section:blog",
        metadata: {
          kind: "article_translate",
          articleId: input.articleId,
          sourceLocale: input.sourceLocale,
          targetLocale: input.targetLocale,
        },
      });
    }

    return { ok: true, translatedDoc: translated };
  } catch (error) {
    logServerActionException("blog.translate.unhandled", error, {
      articleId: input.articleId,
      sourceLocale: input.sourceLocale,
      targetLocale: input.targetLocale,
    });
    return { ok: false, code: "unexpected_error" };
  }
}
