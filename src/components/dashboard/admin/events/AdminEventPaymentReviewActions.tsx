"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, RotateCcw, Trash2, X } from "lucide-react";
import {
  approveEventPaymentAction,
  deleteEventPaymentAction,
  rejectEventPaymentAction,
  revertEventPaymentApprovalAction,
} from "@/app/[locale]/dashboard/admin/events/actions";
import { Button } from "@/components/atoms/Button";
import { ConfirmActionModal } from "@/components/molecules/ConfirmActionModal";

export interface AdminEventPaymentReviewActionsLabels {
  actionsTitle: string;
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
  revert: string;
  revertTooltip: string;
  revertConfirmTitle: string;
  revertConfirmBody: string;
  revertConfirm: string;
  errorNotRevertible: string;
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
  const [revertOpen, setRevertOpen] = useState(false);

  const isPending = status === "pending";
  const isApproved = status === "approved";
  const isRejected = status === "rejected";
  const canDelete = !gatewayProvider && (isPending || isRejected);
  const canRevert = !gatewayProvider && isApproved;
  const hasActions = isPending || canDelete || canRevert;

  if (!hasActions) {
    return null;
  }

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

  async function confirmRevert() {
    setBusy(true);
    setError(null);
    const result = await revertEventPaymentApprovalAction(
      locale,
      paymentId,
      notes || undefined,
      eventId,
    );
    setBusy(false);
    if (!result.ok) {
      setError(result.message === "not_revertible" ? labels.errorNotRevertible : labels.errorSave);
      setRevertOpen(false);
      return;
    }
    setRevertOpen(false);
    router.refresh();
  }

  return (
    <section
      aria-label={labels.actionsTitle}
      className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
    >
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
        {labels.actionsTitle}
      </h3>

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
              className="mt-1 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
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
              size="sm"
              disabled={busy}
              onClick={() => act("approve")}
              aria-label={labels.approveTooltip}
              title={labels.approveTooltip}
              className="min-h-9 w-full"
            >
              <Check className="h-4 w-4 shrink-0" aria-hidden />
              {labels.approve}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => act("reject")}
              aria-label={labels.rejectTooltip}
              title={labels.rejectTooltip}
              className="min-h-9 w-full border border-[var(--color-error)] bg-[var(--color-background)] text-[var(--color-error)] hover:border-[var(--color-error)] hover:bg-[color-mix(in_srgb,var(--color-error)_8%,var(--color-surface))]"
            >
              <X className="h-4 w-4 shrink-0" aria-hidden />
              {labels.reject}
            </Button>
          </>
        ) : null}

        {canRevert ? (
          <>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => setRevertOpen(true)}
              aria-label={labels.revertTooltip}
              title={labels.revertTooltip}
              className="min-h-9 w-full border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] hover:border-[color-mix(in_srgb,var(--color-primary)_35%,var(--color-border))] hover:bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-surface))]"
            >
              <RotateCcw className="h-4 w-4 shrink-0" aria-hidden />
              {labels.revert}
            </Button>
            <ConfirmActionModal
              open={revertOpen}
              onOpenChange={setRevertOpen}
              title={labels.revertConfirmTitle}
              body={labels.revertConfirmBody}
              cancelLabel={labels.cancel}
              confirmLabel={labels.revertConfirm}
              busy={busy}
              disableClose={busy}
              onConfirm={confirmRevert}
            />
          </>
        ) : null}

        {canDelete ? (
          <>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => setDeleteOpen(true)}
              aria-label={labels.deleteTooltip}
              title={labels.deleteTooltip}
              className="min-h-9 w-full border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-error)] hover:border-[var(--color-error)] hover:bg-[color-mix(in_srgb,var(--color-error)_8%,var(--color-surface))]"
            >
              <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
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
    </section>
  );
}
