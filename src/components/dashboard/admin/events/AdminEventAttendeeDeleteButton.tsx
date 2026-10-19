"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteEventAttendeeAction } from "@/app/[locale]/dashboard/admin/events/actions";
import { Button } from "@/components/atoms/Button";
import { ConfirmActionModal } from "@/components/molecules/ConfirmActionModal";

export interface AdminEventAttendeeDeleteButtonLabels {
  delete: string;
  deleteTooltip: string;
  deleteConfirmTitle: string;
  deleteConfirmBody: string;
  deleteConfirm: string;
  cancel: string;
  reasonLabel: string;
  reasonPlaceholder: string;
  notify: string;
  notifyHelp: string;
  errorDelete: string;
  errorNotify: string;
  errorNoEmail: string;
  errorReason: string;
}

interface AdminEventAttendeeDeleteButtonProps {
  locale: string;
  eventId: string;
  attendeeId: string;
  labels: AdminEventAttendeeDeleteButtonLabels;
  /** Icon-only control for dense table rows. */
  compact?: boolean;
}

const fieldClass =
  "min-h-11 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)]";

export function AdminEventAttendeeDeleteButton({
  locale,
  eventId,
  attendeeId,
  labels,
  compact = false,
}: AdminEventAttendeeDeleteButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notify, setNotify] = useState(true);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const reasonMissing = notify && reason.trim().length === 0;

  function openDialog() {
    setNotify(true);
    setReason("");
    setError(null);
    setOpen(true);
  }

  function failureCopy(message: string): string {
    if (message === "notify_failed") return labels.errorNotify;
    if (message === "no_email") return labels.errorNoEmail;
    if (message === "reason_required") return labels.errorReason;
    return labels.errorDelete;
  }

  async function confirmDelete() {
    if (reasonMissing) return;
    setBusy(true);
    setError(null);
    const result = await deleteEventAttendeeAction(locale, attendeeId, eventId, {
      notify,
      reason: notify ? reason.trim() : "",
    });
    setBusy(false);
    if (!result.ok) {
      setError(failureCopy(result.message ?? "delete_failed"));
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button
        type="button"
        variant="destructive"
        disabled={busy}
        onClick={openDialog}
        title={labels.deleteTooltip}
        aria-label={labels.deleteTooltip}
        className={
          compact
            ? "inline-flex h-9 min-h-9 w-9 min-w-9 items-center justify-center p-0"
            : "min-h-9 shrink-0"
        }
      >
        <Trash2 className="h-4 w-4" aria-hidden />
        {compact ? null : labels.delete}
      </Button>
      <ConfirmActionModal
        open={open}
        onOpenChange={setOpen}
        title={labels.deleteConfirmTitle}
        body={labels.deleteConfirmBody}
        formSlot={
          <div className="space-y-3">
            <label className="flex min-h-11 items-start gap-2 text-sm text-[var(--color-foreground)]">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4"
                checked={notify}
                onChange={(event) => setNotify(event.target.checked)}
              />
              <span>
                <span className="font-medium">{labels.notify}</span>
                <span className="mt-1 block text-[var(--color-muted-foreground)]">{labels.notifyHelp}</span>
              </span>
            </label>
            {notify ? (
              <label className="block space-y-1 text-sm text-[var(--color-foreground)]">
                <span className="font-medium">{labels.reasonLabel}</span>
                <textarea
                  className={fieldClass}
                  value={reason}
                  maxLength={500}
                  placeholder={labels.reasonPlaceholder}
                  onChange={(event) => setReason(event.target.value)}
                />
              </label>
            ) : null}
            {error ? (
              <p className="text-sm text-[var(--color-error)]" role="alert">
                {error}
              </p>
            ) : null}
          </div>
        }
        cancelLabel={labels.cancel}
        confirmLabel={labels.deleteConfirm}
        confirmVariant="destructive"
        confirmDisabled={reasonMissing}
        busy={busy}
        disableClose={busy}
        onConfirm={confirmDelete}
      />
    </>
  );
}
