"use client";

import { BlogArticleCtaLink } from "@/components/molecules/BlogArticleCtaLink";
import { BlogGuestCommentFields, type BlogGuestCommentLabels } from "@/components/molecules/BlogGuestCommentFields";
import { BlogGuestCommentSheet } from "@/components/pwa/molecules/BlogGuestCommentSheet";
import { BlogMetricBeacon } from "@/components/blog/BlogMetricBeacon";

export interface BlogArticlePublicExtrasProps {
  locale: string;
  articleId: string;
  ctaLabel: string | null;
  ctaUrl: string | null;
  guestCommentsEnabled: boolean;
  fromIndex: boolean;
  fullWidth?: boolean;
  guestLabels: {
    guestName: string;
    guestEmail: string;
    placeholder: string;
    guestSend: string;
    guestPending: string;
    guestOpen: string;
  };
}

export function BlogArticlePublicExtras({
  locale,
  articleId,
  ctaLabel,
  ctaUrl,
  guestCommentsEnabled,
  fromIndex,
  fullWidth = false,
  guestLabels,
}: BlogArticlePublicExtrasProps) {
  const fields: BlogGuestCommentLabels = {
    name: guestLabels.guestName,
    email: guestLabels.guestEmail,
    comment: guestLabels.placeholder,
    send: guestLabels.guestSend,
    pending: guestLabels.guestPending,
  };
  return (
    <div className="grid gap-4">
      <BlogMetricBeacon
        kind="article_view"
        articleId={articleId}
        source={fromIndex ? "index" : "other"}
        locale={locale}
        stripFromIndex={fromIndex}
      />
      {ctaLabel && ctaUrl ? (
        <BlogArticleCtaLink
          label={ctaLabel}
          href={ctaUrl}
          articleId={articleId}
          locale={locale}
          fullWidth={fullWidth}
        />
      ) : null}
      {guestCommentsEnabled ? (
        fullWidth ? (
          <BlogGuestCommentSheet
            locale={locale}
            articleId={articleId}
            openLabel={guestLabels.guestOpen}
            labels={fields}
          />
        ) : (
          <BlogGuestCommentFields locale={locale} articleId={articleId} labels={fields} />
        )
      ) : null}
    </div>
  );
}
