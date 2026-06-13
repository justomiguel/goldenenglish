"use client";

import { Download, Share, X } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { usePwaInstallPrompt } from "@/hooks/usePwaInstallPrompt";
import type { Dictionary } from "@/types/i18n";

export interface PwaInstallPromptProps {
  copy: Dictionary["pwa"]["install"];
}

export function PwaInstallPrompt({ copy }: PwaInstallPromptProps) {
  const { visible, iosHint, busy, deferred, dismiss, install } = usePwaInstallPrompt();

  if (!visible) return null;

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
      <p className="text-sm font-semibold text-[var(--color-foreground)]">{copy.title}</p>
      <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
        {iosHint ? copy.iosLead : copy.lead}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {iosHint ? (
          <span className="inline-flex min-h-[44px] items-center gap-2 text-xs font-medium text-[var(--color-primary)]">
            <Share className="h-4 w-4 shrink-0" aria-hidden />
            {copy.iosSteps}
          </span>
        ) : (
          <Button type="button" size="sm" onClick={() => void install()} disabled={busy || !deferred}>
            <Download className="h-4 w-4 shrink-0" aria-hidden />
            {copy.install}
          </Button>
        )}
        <Button type="button" size="sm" variant="ghost" onClick={dismiss} disabled={busy}>
          <X className="h-4 w-4 shrink-0" aria-hidden />
          {copy.later}
        </Button>
      </div>
    </div>
  );
}
