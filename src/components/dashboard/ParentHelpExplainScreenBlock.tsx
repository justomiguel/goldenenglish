"use client";

import { Map } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import type { Dictionary } from "@/types/i18n";

export type ParentHelpExplainScreenDict =
  Dictionary["dashboard"]["parentHelpExplainScreen"];

export interface ParentHelpExplainScreenBlockProps {
  dict: ParentHelpExplainScreenDict;
  screenTitle: string | null;
  screenDescription: string | null;
  available: boolean;
  busy?: boolean;
  onStart: () => void;
}

export function ParentHelpExplainScreenBlock({
  dict,
  screenTitle,
  screenDescription,
  available,
  busy = false,
  onStart,
}: ParentHelpExplainScreenBlockProps) {
  return (
    <section
      className="mb-3 space-y-2 border-b border-[var(--color-border)] pb-3"
      aria-label={dict.sectionAria}
    >
      <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
        {dict.sectionHeading}
      </h3>
      {available && screenTitle ? (
        <>
          <p className="text-sm font-semibold text-[var(--color-foreground)]">{screenTitle}</p>
          {screenDescription ? (
            <p className="text-xs text-[var(--color-muted-foreground)]">{screenDescription}</p>
          ) : null}
          <Button
            type="button"
            variant="primary"
            size="sm"
            className="w-full"
            isLoading={busy}
            aria-busy={busy}
            aria-label={dict.startCtaAria.replace("{{title}}", screenTitle)}
            onClick={onStart}
          >
            {busy ? null : (
              <Map className="h-4 w-4 shrink-0" aria-hidden strokeWidth={2} />
            )}
            {busy ? dict.starting : dict.startCta}
          </Button>
        </>
      ) : (
        <>
          <p className="text-sm text-[var(--color-muted-foreground)]">{dict.unavailable}</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full border border-[var(--color-border)]"
            disabled
            aria-label={dict.unavailableCtaAria}
          >
            <Map className="h-4 w-4 shrink-0" aria-hidden strokeWidth={2} />
            {dict.startCta}
          </Button>
        </>
      )}
    </section>
  );
}
