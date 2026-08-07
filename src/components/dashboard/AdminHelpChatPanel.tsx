"use client";

import { CircleHelp, X } from "lucide-react";
import type { ReactNode } from "react";

export interface AdminHelpChatPanelProps {
  id: string;
  titleId: string;
  title: string;
  descriptionId: string;
  description: string;
  closeLabel: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Compact chat-style panel anchored above the admin help FAB (no message composer).
 */
export function AdminHelpChatPanel({
  id,
  titleId,
  title,
  descriptionId,
  description,
  closeLabel,
  onClose,
  children,
}: AdminHelpChatPanelProps) {
  return (
    <div
      id={id}
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      className="mb-3 flex max-h-[min(28rem,calc(100vh-7rem))] w-[min(22rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg"
    >
      <header className="flex shrink-0 items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-primary)] px-3 py-2.5 text-[var(--color-primary-foreground)]">
        <CircleHelp className="h-4 w-4 shrink-0" aria-hidden strokeWidth={2} />
        <h2 id={titleId} className="min-w-0 flex-1 truncate text-sm font-semibold">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--layout-border-radius)] text-[var(--color-primary-foreground)] transition-[transform,box-shadow,background-color] duration-200 ease-out hover:scale-110 hover:bg-[var(--color-primary-dark)] hover:shadow-[inset_0_0_0_2px_color-mix(in_srgb,var(--color-primary-foreground)_50%,transparent)] active:scale-95 active:bg-[var(--color-primary-dark)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-foreground)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-primary)] motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </header>
      <p id={descriptionId} className="sr-only">
        {description}
      </p>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">{children}</div>
    </div>
  );
}
