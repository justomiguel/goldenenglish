"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/atoms/Button";
import { Modal } from "@/components/atoms/Modal";

export interface LongJobActivityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titleId: string;
  title: string;
  /** One-line intro (e.g. “This file has 111 data rows…”). */
  introLine: string;
  /** Main live line (current row / phase). */
  primaryLine: string;
  /** Optional secondary numeric progress (rows completed). */
  secondaryLine: string | null;
  /** Static copy explaining rows vs new logins. */
  explainBody: string;
  logTitle: string;
  lines: string[];
  /** Shown when the activity list has no entries yet (from `common.emptyValue` or similar). */
  emptyLogLine: string;
  isRunning: boolean;
  isCancelling?: boolean;
  onCancel?: () => void | Promise<void>;
  cancelLabel?: string;
  runningAriaLabel?: string;
  closeLabel: string;
}

/**
 * Progress dialog (design system tokens, `font-display`, surfaces).
 * Activity log + live lines; does not replace {@link LongJobLoader} on the page.
 */
export function LongJobActivityModal({
  open,
  onOpenChange,
  titleId,
  title,
  introLine,
  primaryLine,
  secondaryLine,
  explainBody,
  logTitle,
  lines,
  emptyLogLine,
  isRunning,
  isCancelling = false,
  onCancel,
  cancelLabel,
  runningAriaLabel,
  closeLabel,
}: LongJobActivityModalProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const liveRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [lines.length, lines]);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      titleId={titleId}
      title={title}
      disableClose={isRunning}
    >
      <div className="space-y-5">
        <p className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/40 px-3 py-2 text-sm text-[var(--color-muted-foreground)]">
          {introLine}
        </p>

        <div
          ref={liveRef}
          className="rounded-[var(--layout-border-radius)] border-2 border-[var(--color-primary)]/25 bg-[var(--color-surface)] px-4 py-5 text-center shadow-[var(--shadow-card)]"
          aria-live="polite"
          aria-atomic="true"
        >
          {isRunning ? (
            <div className="mb-3 flex justify-center" role="status">
              <span
                className="inline-block size-8 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent"
                aria-hidden
              />
              {runningAriaLabel ? <span className="sr-only">{runningAriaLabel}</span> : null}
            </div>
          ) : null}
          <p className="font-display text-2xl font-bold leading-tight text-[var(--color-secondary)] md:text-3xl">
            {primaryLine}
          </p>
          {secondaryLine ? (
            <p className="mt-2 text-sm font-medium text-[var(--color-primary)]">{secondaryLine}</p>
          ) : null}
        </div>

        <p className="text-xs leading-relaxed text-[var(--color-muted-foreground)]">{explainBody}</p>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
            {logTitle}
          </p>
          <ul
            ref={listRef}
            className="max-h-40 space-y-1.5 overflow-y-auto rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/25 p-3 text-xs text-[var(--color-foreground)]"
          >
            {lines.length === 0 ? (
              <li className="text-[var(--color-muted-foreground)]">{emptyLogLine}</li>
            ) : (
              lines.map((line, i) => (
                <li key={`${i}-${String(line).slice(0, 28)}`} className="border-b border-[var(--color-border)]/50 pb-1.5 last:border-0 last:pb-0">
                  {line}
                </li>
              ))
            )}
          </ul>
        </div>

        {isRunning && onCancel && cancelLabel ? (
          <Button
            type="button"
            variant="secondary"
            className="min-h-[44px] w-full"
            disabled={isCancelling}
            isLoading={isCancelling}
            onClick={() => void onCancel()}
          >
            {cancelLabel}
          </Button>
        ) : null}

        {!isRunning ? (
          <Button type="button" className="min-h-[44px] w-full" onClick={() => onOpenChange(false)}>
            {closeLabel}
          </Button>
        ) : null}
      </div>
    </Modal>
  );
}
