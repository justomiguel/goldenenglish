"use client";

import { useRouter } from "next/navigation";
import { RefreshCw, TriangleAlert } from "lucide-react";
import type { ProgressPickerCopy } from "@/lib/parent/formatProgressSectionLabels";

export interface ProgressSectionLoadFailedProps {
  copy: ProgressPickerCopy;
}

/**
 * Shown instead of a section's own empty state when its read failed.
 *
 * The distinction matters more than it looks: an empty state tells a family their child has nothing,
 * which is a claim we cannot make when the query never came back.
 */
export function ProgressSectionLoadFailed({ copy }: ProgressSectionLoadFailedProps) {
  const router = useRouter();

  return (
    <div
      role="status"
      className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-10 text-center"
    >
      <TriangleAlert
        className="mx-auto h-6 w-6 text-[var(--color-muted-foreground)]"
        aria-hidden
      />
      <p className="mt-3 text-base font-semibold text-[var(--color-foreground)]">
        {copy.loadFailedTitle}
      </p>
      <p className="mx-auto mt-2 max-w-md text-sm text-[var(--color-muted-foreground)]">
        {copy.loadFailedBody}
      </p>
      <button
        type="button"
        onClick={() => router.refresh()}
        className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-foreground)] transition-colors hover:border-[var(--color-primary)]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
      >
        <RefreshCw className="h-4 w-4" aria-hidden />
        {copy.loadFailedRetry}
      </button>
    </div>
  );
}
