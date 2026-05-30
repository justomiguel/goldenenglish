"use client";

import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";
import { BlogArticleDetailDesktop } from "@/components/desktop/organisms/BlogArticleDetailDesktop";
import { BlogArticleDetailMobile } from "@/components/pwa/organisms/BlogArticleDetailMobile";
import type { BlogAttachment } from "@/lib/blog/attachments";
import { Share2 } from "lucide-react";
import { trackEvent } from "@/lib/analytics/trackClient";
import { AnalyticsEntity } from "@/lib/analytics/eventConstants";

interface BlogArticleDetailSurfaceEntryProps {
  title: string;
  excerpt: string;
  bodyHtml: string;
  attachments: BlogAttachment[];
  attachmentsTitle: string;
  shareUrl?: string;
  shareLabel?: string;
}

export function BlogArticleDetailSurfaceEntry({
  title,
  excerpt,
  bodyHtml,
  attachments,
  attachmentsTitle,
  shareUrl,
  shareLabel,
}: BlogArticleDetailSurfaceEntryProps) {
  const shareButton =
    shareUrl && shareLabel ? (
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-md border border-[var(--color-border)] px-3 py-2 text-sm font-medium"
        onClick={() => {
          trackEvent("action", AnalyticsEntity.blog, {
            kind: "article_share_click",
            shareUrl,
          });
          if (typeof navigator !== "undefined" && navigator.share) {
            void navigator.share({ title, text: excerpt, url: shareUrl });
          } else if (typeof navigator !== "undefined" && navigator.clipboard) {
            void navigator.clipboard.writeText(shareUrl);
          }
        }}
      >
        <Share2 aria-hidden className="h-4 w-4" />
        {shareLabel}
      </button>
    ) : null;

  return (
    <SurfaceMountGate
      skeleton={<div className="h-48 animate-pulse rounded bg-[var(--color-muted)]" />}
      desktop={
        <div className="space-y-3">
          <BlogArticleDetailDesktop
            title={title}
            excerpt={excerpt}
            bodyHtml={bodyHtml}
            attachments={attachments}
            attachmentsTitle={attachmentsTitle}
          />
          {shareButton}
        </div>
      }
      narrow={() => (
        <div className="space-y-3">
          <BlogArticleDetailMobile
            title={title}
            excerpt={excerpt}
            bodyHtml={bodyHtml}
            attachments={attachments}
            attachmentsTitle={attachmentsTitle}
          />
          {shareButton}
        </div>
      )}
    >
    </SurfaceMountGate>
  );
}
