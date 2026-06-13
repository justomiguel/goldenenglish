"use client";

import { Send, Upload } from "lucide-react";
import { useId, useRef, useState } from "react";
import { InlineUploadProgressBar } from "@/components/molecules/InlineUploadProgressBar";
import type { FileUploadProgressLabels } from "@/types/fileUploadProgressLabels";

export type ReceiptUploadFlow = "immediate" | "confirm";

export interface ReceiptAutoUploadFieldProps {
  /** Submit label (`immediate`) or send-after-choose label (`confirm`). */
  buttonLabel: string;
  /** When `confirm`, label for the file-picker control. Defaults to `buttonLabel`. */
  chooseButtonLabel?: string;
  /** `immediate`: upload on file pick. `confirm`: pick first, then submit. */
  uploadFlow?: ReceiptUploadFlow;
  accept?: string;
  disabled?: boolean;
  busy?: boolean;
  selectedFileName?: string | null;
  noFileSelectedLabel?: string;
  fileUploadProgress: FileUploadProgressLabels;
  onFileSelected: (file: File) => void | Promise<void>;
  /** Defaults to choose label in `confirm`, else `buttonLabel`. */
  inputAriaLabel?: string;
  inputName?: string;
  className?: string;
}

const pickButtonClassName =
  "inline-flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-2 rounded-[var(--layout-border-radius)] border-2 border-[var(--color-primary)] bg-[var(--color-background)] px-4 py-2 text-center text-sm font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto";

const submitButtonClassName =
  "inline-flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-2 rounded-[var(--layout-border-radius)] border border-transparent bg-[var(--color-primary)] px-4 py-2 text-center text-sm font-semibold text-[var(--color-primary-foreground)] transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto";

/**
 * Receipt file picker. Default `immediate` uploads on selection; `confirm` uses
 * choose-then-send so "Enviar comprobante" is not mistaken for opening the picker again.
 */
export function ReceiptAutoUploadField({
  buttonLabel,
  chooseButtonLabel,
  uploadFlow = "immediate",
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
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const inactive = disabled || busy;
  const chooseLabel = chooseButtonLabel ?? buttonLabel;
  const displayFileName = selectedFileName ?? pendingFile?.name ?? null;

  async function uploadFile(file: File) {
    try {
      await onFileSelected(file);
    } finally {
      setPendingFile(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleImmediatePick(file: File | undefined) {
    if (!file || inactive) return;
    await uploadFile(file);
  }

  function handleConfirmPick(file: File | undefined) {
    if (!file || inactive) return;
    setPendingFile(file);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleConfirmSubmit() {
    if (!pendingFile || inactive) return;
    void uploadFile(pendingFile);
  }

  const chooseAriaLabel = inputAriaLabel ?? (uploadFlow === "confirm" ? chooseLabel : buttonLabel);

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
        aria-label={chooseAriaLabel}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (uploadFlow === "confirm") handleConfirmPick(f);
          else void handleImmediatePick(f);
        }}
      />
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          disabled={inactive}
          onClick={() => inputRef.current?.click()}
          className={pickButtonClassName}
        >
          {!busy ? <Upload className="h-4 w-4 shrink-0" aria-hidden /> : null}
          {busy && uploadFlow === "immediate" ? fileUploadProgress.progressSending : chooseLabel}
        </button>
        {uploadFlow === "confirm" ? (
          <button
            type="button"
            disabled={inactive || pendingFile == null}
            onClick={handleConfirmSubmit}
            className={submitButtonClassName}
          >
            {!busy ? <Send className="h-4 w-4 shrink-0" aria-hidden /> : null}
            {busy ? fileUploadProgress.progressSending : buttonLabel}
          </button>
        ) : null}
      </div>
      {noFileSelectedLabel != null ? (
        <p className="text-sm text-[var(--color-muted-foreground)]" aria-live="polite">
          <span className="break-all font-medium text-[var(--color-foreground)]">
            {displayFileName ?? noFileSelectedLabel}
          </span>
        </p>
      ) : displayFileName ? (
        <p className="text-sm text-[var(--color-muted-foreground)]" aria-live="polite">
          <span className="break-all font-medium text-[var(--color-foreground)]">{displayFileName}</span>
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



