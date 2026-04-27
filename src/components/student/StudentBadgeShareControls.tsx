"use client";

import { useCallback, useState } from "react";
import { Link2, Share2 } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import type { Dictionary } from "@/types/i18n";

type Labels = Pick<
  Dictionary["dashboard"]["student"]["badges"],
  "copyLink" | "share" | "linkCopied" | "copyFailed"
>;

export interface StudentBadgeShareControlsProps {
  shareUrl: string;
  labels: Labels;
}

export function StudentBadgeShareControls({ shareUrl, labels }: StudentBadgeShareControlsProps) {
  const [notice, setNotice] = useState<string | null>(null);

  const copy = useCallback(async () => {
    if (!shareUrl) {
      setNotice(labels.copyFailed);
      return;
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setNotice(labels.linkCopied);
    } catch {
      setNotice(labels.copyFailed);
    }
  }, [labels.copyFailed, labels.linkCopied, shareUrl]);

  const share = useCallback(async () => {
    if (!shareUrl) return;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: document.title, url: shareUrl });
        return;
      } catch {
        // user cancelled
      }
    }
    void copy();
  }, [copy, shareUrl]);

  if (!shareUrl) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="secondary" onClick={copy} className="min-h-[44px]">
        <Link2 className="h-4 w-4 shrink-0" aria-hidden />
        {labels.copyLink}
      </Button>
      <Button type="button" onClick={share} className="min-h-[44px]">
        <Share2 className="h-4 w-4 shrink-0" aria-hidden />
        {labels.share}
      </Button>
      {notice ? (
        <p className="w-full text-sm text-[var(--color-muted-foreground)]" role="status">
          {notice}
        </p>
      ) : null}
    </div>
  );
}
