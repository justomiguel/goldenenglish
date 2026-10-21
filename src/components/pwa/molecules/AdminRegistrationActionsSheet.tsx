"use client";

import { CheckCircle2, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Modal } from "@/components/atoms/Modal";
import { AdminRegistrationChargeActions } from "@/components/dashboard/AdminRegistrationChargeActions";
import type { Dictionary } from "@/types/i18n";
import type { AdminRegistrationRow } from "@/types/adminRegistration";

type RegLabels = Dictionary["admin"]["registrations"];

export function AdminRegistrationActionsSheet({
  open,
  onOpenChange,
  row,
  busy,
  labels,
  onEdit,
  onDelete,
  onMarkContacted,
  onRevertToNew,
  onStartEnrollmentFee,
  onStartJoinCharge,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: AdminRegistrationRow;
  busy: boolean;
  labels: RegLabels;
  onEdit: (row: AdminRegistrationRow) => void;
  onDelete: (row: AdminRegistrationRow) => void;
  onMarkContacted: (row: AdminRegistrationRow) => void;
  onRevertToNew: (row: AdminRegistrationRow) => void;
  onStartEnrollmentFee: (row: AdminRegistrationRow) => void;
  onStartJoinCharge: (row: AdminRegistrationRow) => void;
}) {
  const isPending = row.status === "new";
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      titleId={`admin-registration-actions-${row.id}`}
      title={labels.mobileSortSheetTitle}
      stackBelowTour
    >
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="secondary"
          className="min-h-11 justify-start"
          disabled={busy}
          onClick={() => {
            onOpenChange(false);
            onEdit(row);
          }}
        >
          <Pencil className="h-4 w-4" aria-hidden />
          {labels.editTitle}
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="min-h-11 justify-start"
          disabled={busy}
          onClick={() => {
            onOpenChange(false);
            if (isPending) onMarkContacted(row);
            else onRevertToNew(row);
          }}
        >
          {isPending ? <CheckCircle2 className="h-4 w-4" aria-hidden /> : <RotateCcw className="h-4 w-4" aria-hidden />}
          {isPending ? labels.markContacted : labels.revertToNew}
        </Button>
        <AdminRegistrationChargeActions
          row={row}
          labels={labels}
          busy={busy}
          buttonClassName="min-h-11 w-full justify-start"
          onStartEnrollmentFee={onStartEnrollmentFee}
          onStartJoinCharge={onStartJoinCharge}
        />
        <Button
          type="button"
          variant="secondary"
          className="min-h-11 justify-start border-[var(--color-error)] text-[var(--color-error)]"
          disabled={busy}
          onClick={() => {
            onOpenChange(false);
            onDelete(row);
          }}
        >
          <Trash2 className="h-4 w-4" aria-hidden />
          {labels.delete}
        </Button>
      </div>
    </Modal>
  );
}
