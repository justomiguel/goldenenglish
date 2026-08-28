"use client";

import { Modal } from "@/components/atoms/Modal";
import { InlineUploadProgressBar } from "@/components/molecules/InlineUploadProgressBar";

export type BlockingFileUploadModalProps = {
  open: boolean;
  title: string;
  filename: string;
  fileIndex: string | null;
  phaseLabel: string;
  percent: number | null;
  indeterminate: boolean;
  runningAriaLabel: string;
};

const ELLIPSIS = "…";

export function BlockingFileUploadModal({
  open,
  title,
  filename,
  fileIndex,
  phaseLabel,
  percent,
  indeterminate,
  runningAriaLabel,
}: BlockingFileUploadModalProps) {
  const primary =
    !indeterminate && typeof percent === "number" ? `${Math.round(percent)}%` : ELLIPSIS;

  return (
    <Modal
      open={open}
      onOpenChange={() => undefined}
      titleId="blocking-file-upload-title"
      title={title}
      disableClose
      closeLabel=""
    >
      <div className="space-y-4">
        <p className="truncate text-sm text-[var(--color-muted-foreground)]">{filename}</p>
        {fileIndex ? (
          <p className="text-sm font-medium text-[var(--color-foreground)]">{fileIndex}</p>
        ) : null}
        <div
          className="rounded-[var(--layout-border-radius)] border-2 border-[var(--color-primary)]/25 bg-[var(--color-surface)] px-4 py-5 text-center shadow-[var(--shadow-card)]"
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="mb-3 flex justify-center" role="status">
            <span
              className="inline-block size-8 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent"
              aria-hidden
            />
            <span className="sr-only">{runningAriaLabel}</span>
          </div>
          <p className="font-display text-2xl font-bold leading-tight text-[var(--color-primary)] md:text-3xl">
            {primary}
          </p>
          <p className="mt-2 text-sm font-medium text-[var(--color-primary)]">{phaseLabel}</p>
        </div>
        <InlineUploadProgressBar
          className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/15 px-3 py-3"
          label={phaseLabel}
          value={indeterminate ? undefined : percent ?? undefined}
          indeterminate={indeterminate}
        />
      </div>
    </Modal>
  );
}
