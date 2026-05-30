"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { trackEvent } from "@/lib/analytics/trackClient";
import { AnalyticsEntity } from "@/lib/analytics/eventConstants";

interface BlogArticleShareButtonProps {
  title: string;
  excerpt: string;
  shareUrl: string;
  shareLabel: string;
  shareCopiedLabel: string;
}

export function BlogArticleShareButton({
  title,
  excerpt,
  shareUrl,
  shareLabel,
  shareCopiedLabel,
}: BlogArticleShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function onShare() {
    trackEvent("action", AnalyticsEntity.blog, {
      kind: "article_share_click",
      shareUrl,
    });

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text: excerpt, url: shareUrl });
        return;
      } catch {
        // User dismissed or share failed — fall through to clipboard.
      }
    }

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    }
  }

  return (
    <button
      type="button"
      className="inline-flex min-h-[44px] w-full max-w-sm items-center justify-center gap-2.5 rounded-full bg-[var(--color-secondary)] px-6 py-3 text-base font-semibold text-[var(--color-secondary-foreground)] shadow-md ring-2 ring-[var(--color-secondary)]/20 transition hover:brightness-110 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 sm:w-auto"
      onClick={() => void onShare()}
    >
      {copied ? (
        <Check aria-hidden className="h-5 w-5 shrink-0" />
      ) : (
        <Share2 aria-hidden className="h-5 w-5 shrink-0" />
      )}
      {copied ? shareCopiedLabel : shareLabel}
    </button>
  );
}
