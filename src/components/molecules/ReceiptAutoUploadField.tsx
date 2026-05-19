"use client";

import { Upload } from "lucide-react";
import { useId, useRef } from "react";
import { InlineUploadProgressBar } from "@/components/molecules/InlineUploadProgressBar";
import type { FileUploadProgressLabels } from "@/types/fileUploadProgressLabels";

export interface ReceiptAutoUploadFieldProps {
  /** Visible action label on the single upload control. */
  buttonLabel: string;
  accept?: string;
  disabled?: boolean;
  busy?: boolean;
  selectedFileName?: string | null;
  noFileSelectedLabel?: string;
  fileUploadProgress: FileUploadProgressLabels;
  onFileSelected: (file: File) => void | Promise<void>;
  /** Defaults to `buttonLabel`. */
  inputAriaLabel?: string;
  inputName?: string;
  className?: string;
}

/**
 * One control: pick a receipt file and upload immediately on selection (no separate submit).
 */
export function ReceiptAutoUploadField({
  buttonLabel,
  accept = "image/*,application/pdf",
  disabled = false,
  busy = false,
  selectedFileName = null,
  noFileSelectedLabel,
  fileUploadProgress,
  onFileSelected,
  inputAriaLabel,
  inputName = "receipt",
  className = "",
}: ReceiptAutoUploadFieldProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const inactive = disabled || busy;

  async function handleChange(file: File | undefined) {
    if (!file || inactive) return;
    try {
      await onFileSelected(file);
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className={className ? `space-y-2 ${className}` : "space-y-2"}>
      <input
        ref={inputRef}
        id={inputId}
        name={inputName}
        type="file"
        accept={accept}
        className="sr-only"
        disabled={inactive}
        aria-label={inputAriaLabel ?? buttonLabel}
        onChange={(e) => {
          const f = e.target.files?.[0];
          void handleChange(f);
        }}
      />
      <button
        type="button"
        disabled={inactive}
        onClick={() => inputRef.current?.click()}
        className="inline-flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-2 rounded-[var(--layout-border-radius)] border-2 border-[var(--color-primary)] bg-[var(--color-background)] px-4 py-2 text-center text-sm font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {!busy ? <Upload className="h-4 w-4 shrink-0" aria-hidden /> : null}
        {busy ? fileUploadProgress.progressSending : buttonLabel}
      </button>
      {noFileSelectedLabel != null ? (
        <p className="text-sm text-[var(--color-muted-foreground)]" aria-live="polite">
          <span className="break-all font-medium text-[var(--color-foreground)]">
            {selectedFileName ?? noFileSelectedLabel}
          </span>
        </p>
      ) : selectedFileName ? (
        <p className="text-sm text-[var(--color-muted-foreground)]" aria-live="polite">
          <span className="break-all font-medium text-[var(--color-foreground)]">{selectedFileName}</span>
        </p>
      ) : null}
      {busy ? (
        <InlineUploadProgressBar
          label={fileUploadProgress.progressSending}
          indeterminate
          className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/15 px-3 py-3"
        />
      ) : null}
    </div>
  );
}



