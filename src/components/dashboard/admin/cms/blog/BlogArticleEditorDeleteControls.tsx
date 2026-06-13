"use client";

import { Trash2 } from "lucide-react";
import { ConfirmActionModal } from "@/components/molecules/ConfirmActionModal";

interface BlogArticleEditorDeleteControlsProps {
  labels: {
    delete: string;
    deleteConfirmTitle: string;
    deleteConfirmBody: string;
    deleteCancel: string;
    deleteConfirm: string;
  };
  open: boolean;
  busy: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function BlogArticleEditorDeleteControls({
  labels,
  open,
  busy,
  onOpenChange,
  onConfirm,
}: BlogArticleEditorDeleteControlsProps) {
  return (
    <>
      <div className="border-t border-[var(--color-border)] pt-4">
        <button
          type="button"
          disabled={busy}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-md border border-[var(--color-error)] px-4 py-2 text-sm font-semibold text-[var(--color-error)] disabled:opacity-70"
          onClick={() => onOpenChange(true)}
        >
          <Trash2 aria-hidden className="h-4 w-4" />
          {labels.delete}
        </button>
      </div>
      <ConfirmActionModal
        open={open}
        onOpenChange={onOpenChange}
        title={labels.deleteConfirmTitle}
        body={labels.deleteConfirmBody}
        cancelLabel={labels.deleteCancel}
        confirmLabel={labels.deleteConfirm}
        confirmVariant="destructive"
        busy={busy}
        disableClose={busy}
        onConfirm={onConfirm}
      />
    </>
  );
}
