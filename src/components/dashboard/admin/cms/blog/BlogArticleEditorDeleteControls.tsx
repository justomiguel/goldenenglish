"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/atoms/Button";
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
        <Button
          type="button"
          variant="destructive"
          size="md"
          disabled={busy}
          className="min-h-[44px]"
          onClick={() => onOpenChange(true)}
        >
          <Trash2 aria-hidden className="h-4 w-4" />
          {labels.delete}
        </Button>
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
