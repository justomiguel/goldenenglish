"use client";

import { useState } from "react";
import { CheckSquare, Mail, MailOpen, Square, Trash2, X } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { ConfirmActionModal } from "@/components/molecules/ConfirmActionModal";
import type { Dictionary } from "@/types/i18n";
import type { BulkSelectionErrorCode } from "@/hooks/useAdminMessagesBulkSelection";

interface AdminMessagesBulkBarProps {
  labels: Dictionary["admin"]["messages"];
  selectedCount: number;
  allVisibleSelected: boolean;
  visibleCount: number;
  busy: boolean;
  errorCode: BulkSelectionErrorCode | null;
  /** Inbox only: show mark read / unread. */
  showReadActions: boolean;
  onSelectAll: () => void;
  onClear: () => void;
  onMarkRead: () => void | Promise<void | boolean>;
  onMarkUnread: () => void | Promise<void | boolean>;
  onDelete: () => void | Promise<void | boolean>;
}

function errorMessage(
  code: BulkSelectionErrorCode,
  labels: Dictionary["admin"]["messages"],
): string {
  if (code === "not_found") return labels.bulkDeleteNotFound;
  if (code === "too_many") return labels.bulkTooMany;
  return labels.bulkActionError;
}

export function AdminMessagesBulkBar({
  labels,
  selectedCount,
  allVisibleSelected,
  visibleCount,
  busy,
  errorCode,
  showReadActions,
  onSelectAll,
  onClear,
  onMarkRead,
  onMarkUnread,
  onDelete,
}: AdminMessagesBulkBarProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const countLabel = labels.bulkSelectedCount.replace("{{count}}", String(selectedCount));
  const confirmBody = labels.bulkDeleteConfirmDescription.replace(
    "{{count}}",
    String(selectedCount),
  );
  const hasSelection = selectedCount > 0;

  if (visibleCount === 0) return null;

  return (
    <div
      className={[
        "mt-4 space-y-2",
        hasSelection
          ? "sticky top-0 z-20 -mx-1 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-3 shadow-sm"
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
      data-testid="admin-messages-bulk-bar"
      data-sticky={hasSelection ? "true" : "false"}
      role={hasSelection ? "toolbar" : undefined}
      aria-label={hasSelection ? countLabel : undefined}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          className="min-h-9"
          disabled={busy || visibleCount === 0}
          onClick={allVisibleSelected ? onClear : onSelectAll}
          title={
            allVisibleSelected ? labels.bulkClearSelectionTitle : labels.bulkSelectAllTitle
          }
          aria-label={
            allVisibleSelected ? labels.bulkClearSelection : labels.bulkSelectAll
          }
        >
          {allVisibleSelected ? (
            <CheckSquare className="h-4 w-4 shrink-0" aria-hidden />
          ) : (
            <Square className="h-4 w-4 shrink-0" aria-hidden />
          )}
          {allVisibleSelected ? labels.bulkClearSelection : labels.bulkSelectAll}
        </Button>

        {hasSelection ? (
          <>
            <span className="text-sm font-medium text-[var(--color-foreground)]" aria-live="polite">
              {countLabel}
            </span>
            {showReadActions ? (
              <>
                <Button
                  type="button"
                  variant="primary"
                  className="min-h-9"
                  disabled={busy}
                  onClick={() => void onMarkRead()}
                  title={labels.bulkMarkReadTitle}
                >
                  <MailOpen className="h-4 w-4 shrink-0" aria-hidden />
                  {labels.bulkMarkRead}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="min-h-9"
                  disabled={busy}
                  onClick={() => void onMarkUnread()}
                  title={labels.bulkMarkUnreadTitle}
                >
                  <Mail className="h-4 w-4 shrink-0" aria-hidden />
                  {labels.bulkMarkUnread}
                </Button>
              </>
            ) : null}
            <Button
              type="button"
              variant="secondary"
              className="min-h-9 border-[var(--color-error)] text-[var(--color-error)] hover:bg-[var(--color-muted)]"
              disabled={busy}
              onClick={() => setConfirmDelete(true)}
              title={labels.bulkDeleteTitle}
            >
              <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
              {labels.bulkDelete}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="min-h-9"
              disabled={busy}
              onClick={onClear}
              title={labels.bulkClearSelectionTitle}
              aria-label={labels.bulkClearSelection}
            >
              <X className="h-4 w-4 shrink-0" aria-hidden />
              {labels.bulkClearSelection}
            </Button>
          </>
        ) : null}
      </div>

      {errorCode && hasSelection ? (
        <p className="text-sm font-medium text-[var(--color-error)]" role="alert">
          {errorMessage(errorCode, labels)}
        </p>
      ) : null}

      <ConfirmActionModal
        open={confirmDelete}
        onOpenChange={(next) => {
          if (!busy) setConfirmDelete(next);
        }}
        title={labels.bulkDeleteConfirmTitle}
        description={confirmBody}
        cancelLabel={labels.deletePortalMessageCancel}
        confirmLabel={labels.bulkDeleteConfirm}
        confirmVariant="destructive"
        busy={busy}
        disableClose={busy}
        onConfirm={() => {
          void (async () => {
            const ok = await onDelete();
            if (ok !== false) setConfirmDelete(false);
          })();
        }}
      />
    </div>
  );
}
