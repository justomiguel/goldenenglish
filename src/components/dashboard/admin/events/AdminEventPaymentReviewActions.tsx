"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Trash2, X } from "lucide-react";
import {
  approveEventPaymentAction,
  deleteEventPaymentAction,
  rejectEventPaymentAction,
} from "@/app/[locale]/dashboard/admin/events/actions";
import { Button } from "@/components/atoms/Button";
import { ConfirmActionModal } from "@/components/molecules/ConfirmActionModal";

export interface AdminEventPaymentReviewActionsLabels {
  notes: string;
  notesTooltip: string;
  approve: string;
  reject: string;
  delete: string;
  approveTooltip: string;
  rejectTooltip: string;
  deleteTooltip: string;
  deleteConfirmTitle: string;
  deleteConfirmBody: string;
  deleteConfirm: string;
  cancel: string;
  errorSave: string;
  errorDelete: string;
}

interface AdminEventPaymentReviewActionsProps {
  locale: string;
  eventId: string;
  paymentId: string;
  status: string;
  gatewayProvider: string | null;
  initialNotes: string;
  labels: AdminEventPaymentReviewActionsLabels;
}

export function AdminEventPaymentReviewActions({
  locale,
  eventId,
  paymentId,
  status,
  gatewayProvider,
  initialNotes,
  labels,
}: AdminEventPaymentReviewActionsProps) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const isPending = status === "pending";
  const isRejected = status === "rejected";
  const canDelete = !gatewayProvider && (isPending || isRejected);

  async function act(kind: "approve" | "reject") {
    setBusy(true);
    setError(null);
    const result =
      kind === "approve"
        ? await approveEventPaymentAction(locale, paymentId, notes || undefined, eventId)
        : await rejectEventPaymentAction(locale, paymentId, notes || " ", eventId);

    setBusy(false);
    if (!result.ok) {
      setError(labels.errorSave);
      return;
    }
    router.refresh();
  }

  async function confirmDelete() {
    setBusy(true);
    setError(null);
    const result = await deleteEventPaymentAction(locale, paymentId, eventId);
    setBusy(false);
    if (!result.ok) {
      setError(labels.errorDelete);
      setDeleteOpen(false);
      return;
    }
    setDeleteOpen(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      {isPending ? (
        <label className="block text-sm text-[var(--color-foreground)]">
          <span className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
            {labels.notes}
          </span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.currentTarget.value)}
            rows={2}
            title={labels.notesTooltip}
            className="mt-1 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
          />
        </label>
      ) : null}

      {error ? (
        <p className="text-sm text-[var(--color-error)]" role="alert">
          {error}
        </p>
      ) : null}

      {isPending ? (
        <>
          <Button
            type="button"
            disabled={busy}
            onClick={() => act("approve")}
            title={labels.approveTooltip}
            className="w-full"
          >
            <Check className="h-4 w-4" aria-hidden />
            {labels.approve}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={() => act("reject")}
            title={labels.rejectTooltip}
            className="w-full border border-[var(--color-error)] text-[var(--color-error)]"
          >
            <X className="h-4 w-4" aria-hidden />
            {labels.reject}
          </Button>
        </>
      ) : null}

      {canDelete ? (
        <>
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={() => setDeleteOpen(true)}
            title={labels.deleteTooltip}
            className="w-full border border-[var(--color-border)] text-[var(--color-muted-foreground)]"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            {labels.delete}
          </Button>
          <ConfirmActionModal
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
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
      ) : null}
    </div>
  );
}
