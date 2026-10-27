import "server-only";

import { sendRegistrationAdminEmails } from "@/lib/email/registrationIntakeEmails";
import { escapeEventEmailHtml } from "@/lib/events/eventEmailCopy";
import { logServerException, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { getRequestPublicSiteUrl } from "@/lib/site/requestPublicUrl";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Locale } from "@/types/i18n";

function mailLocale(raw: string | null | undefined): Locale {
  return raw === "en" || raw === "pt" ? raw : "es";
}

async function reviewUrl(locale: Locale): Promise<string> {
  try {
    const origin = (await getRequestPublicSiteUrl())?.origin;
    if (!origin) return "";
    return `${origin}/${locale}/dashboard/admin/cms/blog/review`;
  } catch (err) {
    logServerException("notifyAdminsBlogPendingReview:url", err);
    return "";
  }
}

export async function notifyAdminsBlogPendingReview(input: {
  supabase: SupabaseClient;
  articleId: string;
  locale?: string | null;
}): Promise<void> {
  try {
    const locale = mailLocale(input.locale);
    const { data, error } = await input.supabase
      .from("blog_article_translations")
      .select("locale, title")
      .eq("article_id", input.articleId);
    if (error) {
      logSupabaseClientError("notifyAdminsBlogPendingReview:title", error, {
        articleId: input.articleId,
      });
    }
    const rows = (data ?? []) as { locale: string; title: string }[];
    const title =
      rows.find((row) => row.locale === locale)?.title ??
      rows.find((row) => row.locale === "es")?.title ??
      rows[0]?.title ??
      "—";
    await sendRegistrationAdminEmails({
      locale,
      templateKey: "blog.admin_pending_review",
      vars: {
        articleTitle: escapeEventEmailHtml(title.trim() || "—"),
        adminUrl: await reviewUrl(locale),
      },
    });
  } catch (err) {
    logServerException("notifyAdminsBlogPendingReview", err, { articleId: input.articleId });
  }
}
