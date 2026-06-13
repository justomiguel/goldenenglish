"use server";

import { assertBlogAuthor } from "@/lib/dashboard/assertBlogAuthor";
import {
  ADMIN_SESSION_FORBIDDEN,
  ADMIN_SESSION_UNAUTHORIZED,
} from "@/lib/dashboard/adminSessionErrors";
import { logServerAuthzDenied } from "@/lib/logging/serverActionLog";
import { googleTranslateClient } from "@/lib/blog/integrations/google/googleTranslateClient";
import { googleTranslateBlogFields } from "@/lib/blog/integrations/google/googleTranslateText";
import { loadGoogleTranslateCredentials } from "@/lib/blog/integrations/google/loadGoogleTranslateCredentials";
import type { BlogLocale } from "@/lib/blog/domain";
import { translateArticleAction } from "@/lib/blog/server";
import { z } from "zod";

export async function translateBlogArticleAdminAction(input: {
  articleId: string;
  sourceLocale: BlogLocale;
  targetLocale: BlogLocale;
  tipTapDoc: Record<string, unknown>;
}) {
  const { supabase, user } = await assertBlogAuthor();
  const credentials = await loadGoogleTranslateCredentials(supabase);
  if (!credentials.apiKey) return { ok: false, code: "google_key_missing" };

  return translateArticleAction(
    supabase,
    {
      translateHtml: ({ html, sourceLocale, targetLocale }) =>
        googleTranslateClient({
          apiKey: credentials.apiKey ?? "",
          html,
          sourceLocale,
          targetLocale,
        }),
    },
    { ...input, actorId: user.id },
  );
}

const TranslateFieldsSchema = z.object({
  articleId: z.string().uuid(),
  sourceLocale: z.enum(["en", "es", "pt"]),
  targetLocale: z.enum(["en", "es", "pt"]),
  title: z.string().max(180),
  excerpt: z.string().max(280),
  bodyHtml: z.string().max(500_000),
});

export async function translateBlogArticleFieldsAdminAction(raw: unknown) {
  const parsed = TranslateFieldsSchema.safeParse(raw);
  if (!parsed.success) return { ok: false as const, code: "invalid_input" as const };
  if (parsed.data.sourceLocale === parsed.data.targetLocale) {
    return { ok: false as const, code: "same_locale" as const };
  }

  try {
    const { supabase, user } = await assertBlogAuthor();
    const credentials = await loadGoogleTranslateCredentials(supabase);
    if (!credentials.apiKey) return { ok: false as const, code: "google_key_missing" as const };

    const { data: article } = await supabase
      .from("blog_articles")
      .select("id")
      .eq("id", parsed.data.articleId)
      .maybeSingle();
    if (!article) return { ok: false as const, code: "article_not_found" as const };

    const fields = await googleTranslateBlogFields({
      apiKey: credentials.apiKey,
      sourceLocale: parsed.data.sourceLocale,
      targetLocale: parsed.data.targetLocale,
      title: parsed.data.title,
      excerpt: parsed.data.excerpt,
      bodyHtml: parsed.data.bodyHtml,
    });

    await supabase.from("user_events").insert({
      user_id: user.id,
      event_type: "action",
      entity: "section:blog",
      metadata: {
        kind: "article_translate_fields",
        articleId: parsed.data.articleId,
        sourceLocale: parsed.data.sourceLocale,
        targetLocale: parsed.data.targetLocale,
      },
    });

    return { ok: true as const, fields };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === ADMIN_SESSION_UNAUTHORIZED || message === ADMIN_SESSION_FORBIDDEN) {
      logServerAuthzDenied("translateBlogArticleFieldsAdminAction");
    }
    return { ok: false as const, code: "unexpected_error" as const };
  }
}
