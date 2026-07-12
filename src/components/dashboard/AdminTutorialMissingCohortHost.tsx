"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { AlertCircle, X } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import {
  ADMIN_TUTORIAL_MISSING_COHORT_NOTICE_EVENT,
  type MissingCohortNoticeDetail,
} from "@/lib/admin-tutorials/client/missingCohortPrompt";

export function AdminTutorialMissingCohortHost() {
  const titleId = useId();
  const descId = useId();
  const [pending, setPending] = useState<MissingCohortNoticeDetail | null>(null);

  const dismiss = useCallback(() => {
    setPending((current) => {
      current?.resolve();
      return null;
    });
  }, []);

  useEffect(() => {
    const onNotice = (event: Event) => {
      const detail = (event as CustomEvent<MissingCohortNoticeDetail>).detail;
      if (!detail?.resolve) return;
      setPending((current) => {
        current?.resolve();
        return detail;
      });
    };
    window.addEventListener(ADMIN_TUTORIAL_MISSING_COHORT_NOTICE_EVENT, onNotice);
    return () => {
      window.removeEventListener(ADMIN_TUTORIAL_MISSING_COHORT_NOTICE_EVENT, onNotice);
    };
  }, []);

  if (!pending) return null;

  return (
    <div
      className="ge-admin-tutorial-prompt fixed inset-0 z-[2000000001] flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-[color-mix(in_srgb,var(--color-background)_72%,transparent)] backdrop-blur-md"
        aria-label={pending.copy.dismiss}
        onClick={dismiss}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="relative z-[1] w-full max-w-md rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-0 shadow-[var(--shadow-card)] ring-2 ring-[var(--color-primary)]/10"
      >
        <header className="flex items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-primary)] px-4 py-3 text-[var(--color-primary-foreground)]">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden strokeWidth={2} />
          <h2 id={titleId} className="min-w-0 flex-1 text-base font-semibold leading-snug">
            {pending.copy.title}
          </h2>
        </header>
        <p id={descId} className="px-4 py-4 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
          {pending.copy.description}
        </p>
        <div className="flex justify-end border-t border-[var(--color-border)] px-4 py-4">
          <Button type="button" onClick={dismiss}>
            <X className="h-4 w-4 shrink-0" aria-hidden />
            {pending.copy.dismiss}
          </Button>
        </div>
      </div>
    </div>
  );
}
