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
  errorDelete: string;
  errorNotDeletable: string;
}

interface AdminEventAttendeeDeleteButtonProps {
  locale: string;
  eventId: string;
  attendeeId: string;
  labels: AdminEventAttendeeDeleteButtonLabels;
  /** Icon-only control for dense table rows. */
  compact?: boolean;
}

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
  const [error, setError] = useState<string | null>(null);

  async function confirmDelete() {
    setBusy(true);
    setError(null);
    const result = await deleteEventAttendeeAction(locale, attendeeId, eventId);
    setBusy(false);
    if (!result.ok) {
      setError(
        result.message === "not_deletable" ? labels.errorNotDeletable : labels.errorDelete,
      );
      setOpen(false);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        disabled={busy}
        onClick={() => setOpen(true)}
        title={labels.deleteTooltip}
        aria-label={labels.deleteTooltip}
        className={
          compact
            ? "inline-flex h-9 min-h-9 w-9 min-w-9 items-center justify-center p-0 text-[var(--color-muted-foreground)] hover:border-[var(--color-error)] hover:bg-[color-mix(in_srgb,var(--color-error)_8%,var(--color-surface))] hover:text-[var(--color-error)]"
            : "border border-[var(--color-border)] text-[var(--color-muted-foreground)]"
        }
      >
        <Trash2 className="h-4 w-4" aria-hidden />
        {compact ? null : labels.delete}
      </Button>
      {error && !compact ? (
        <p className="text-sm text-[var(--color-error)]" role="alert">
          {error}
        </p>
      ) : null}
      <ConfirmActionModal
        open={open}
        onOpenChange={setOpen}
        title={labels.deleteConfirmTitle}
        body={labels.deleteConfirmBody}
        cancelLabel={labels.cancel}
        confirmLabel={labels.deleteConfirm}
        confirmVariant="destructive"
        busy={busy}
        disableClose={busy}
        onConfirm={confirmDelete}
      />
    </>
  );
}
