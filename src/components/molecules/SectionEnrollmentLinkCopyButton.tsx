"use client";

import { useState } from "react";
import { Copy } from "lucide-react";
import { Button } from "@/components/atoms/Button";

interface SectionEnrollmentLinkCopyButtonProps {
  url: string;
  labels: { copy: string; copied: string };
}

export function SectionEnrollmentLinkCopyButton({
  url,
  labels,
}: SectionEnrollmentLinkCopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <Button type="button" variant="secondary" size="sm" onClick={onCopy}>
        <Copy className="h-4 w-4 shrink-0" aria-hidden />
        {labels.copy}
      </Button>
      {copied ? (
        <span className="text-xs text-[var(--color-muted-foreground)]" role="status">
          {labels.copied}
        </span>
      ) : null}
    </div>
  );
}
