"use client";

import { Loader2, Trash2, X } from "lucide-react";
import { Modal } from "@/components/atoms/Modal";
import { Button } from "@/components/atoms/Button";

export interface DeleteUsersConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  /** Optional (e.g. guardian → linked students cascade). */
  cascadeNotice?: string;
  /** Shown while the server previews impact (IDs may expand). */
  resolvingNotice?: string;
  /** Error fetching preview — confirm still deletes using server recomputation if user proceeds. */
  previewErrorNotice?: string;
  body: string;
  cancelLabel: string;
  confirmLabel: string;
  confirmDisabled?: boolean;
  busy: boolean;
  /** Linked student accounts included only after preview resolves. */
  addedStudentsHeading?: string;
  addedStudents?: { id: string; label: string }[];
  onConfirm: () => void;
}

export function DeleteUsersConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  cascadeNotice,
  resolvingNotice,
  previewErrorNotice,
  body,
  cancelLabel,
  confirmLabel,
  confirmDisabled = false,
  busy,
  addedStudentsHeading,
  addedStudents,
  onConfirm,
}: DeleteUsersConfirmModalProps) {
  const previewResolving = Boolean(resolvingNotice);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      titleId="del-users-modal-title"
      descriptionId="del-users-modal-desc"
      title={title}
    >
      <div
        id="del-users-modal-desc"
        className="space-y-2"
        aria-busy={previewResolving || undefined}
      >
        <p className="text-sm text-[var(--color-muted-foreground)]">{description}</p>
        {previewErrorNotice ? (
          <p className="text-sm text-[var(--color-warning)]" role="status">
            {previewErrorNotice}
          </p>
        ) : null}
        {previewResolving ? (
          <div
            role="status"
            aria-live="polite"
            className="flex min-h-[3.5rem] items-center gap-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/40 px-3 py-3"
          >
            <Loader2
              className="h-5 w-5 shrink-0 animate-spin text-[var(--color-primary)]"
              aria-hidden
            />
            <p className="text-sm text-[var(--color-foreground)]">{resolvingNotice}</p>
          </div>
        ) : (
          <>
            {cascadeNotice ? (
              <p className="text-sm font-medium text-[var(--color-secondary)]">{cascadeNotice}</p>
            ) : null}
            <p className="text-sm font-medium text-[var(--color-foreground)]">{body}</p>
            {addedStudents?.length ? (
              <div className="space-y-2">
                {addedStudentsHeading ? (
                  <p className="text-sm font-medium text-[var(--color-foreground)]">
                    {addedStudentsHeading}
                  </p>
                ) : null}
                <ul
                  className="max-h-40 overflow-y-auto rounded-md border border-[var(--color-border)] bg-[var(--color-muted)]/30 px-3 py-2"
                  aria-label={addedStudentsHeading}
                >
                  {addedStudents.map((row) => (
                    <li
                      key={row.id}
                      className="border-b border-[var(--color-border)]/50 py-1.5 text-sm text-[var(--color-foreground)] last:border-b-0"
                    >
                      {row.label}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        )}
      </div>
      <div className="flex flex-wrap justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="secondary"
          disabled={busy}
          onClick={() => onOpenChange(false)}
        >
          <X className="h-4 w-4 shrink-0" aria-hidden />
          {cancelLabel}
        </Button>
        <Button
          type="button"
          className="!bg-[var(--color-error)] !text-white hover:!bg-[var(--color-error)]/90 focus-visible:ring-[var(--color-error)]"
          disabled={busy || confirmDisabled}
          isLoading={busy || previewResolving}
          onClick={onConfirm}
        >
          {busy || previewResolving ? null : (
            <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
          )}
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
