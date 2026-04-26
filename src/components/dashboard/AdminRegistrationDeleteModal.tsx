"use client";

import { Trash2, X } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Modal } from "@/components/atoms/Modal";
import type { AdminRegistrationRow } from "@/types/adminRegistration";
import type { Dictionary } from "@/types/i18n";

interface AdminRegistrationDeleteModalProps {
  row: AdminRegistrationRow | null;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
  labels: Dictionary["admin"]["registrations"];
}

export function AdminRegistrationDeleteModal({
  row,
  busy,
  onClose,
  onConfirm,
  labels,
}: AdminRegistrationDeleteModalProps) {
  return (
    <Modal
      open={row !== null}
      onOpenChange={(o) => !o && onClose()}
      titleId="reg-del-title"
      descriptionId="reg-del-desc"
      title={labels.deleteConfirmTitle}
    >
      <p id="reg-del-desc" className="text-sm text-[var(--color-muted-foreground)]">
        {labels.deleteConfirmLead}
      </p>
      <div className="flex flex-wrap justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="secondary"
          className="min-h-[44px] px-4"
          onClick={onClose}
        >
          <X className="h-4 w-4 shrink-0" aria-hidden />
          {labels.cancel}
        </Button>
        <Button
          type="button"
          className="min-h-[44px] px-4"
          disabled={busy}
          isLoading={busy}
          onClick={() => void onConfirm()}
        >
          {busy ? null : <Trash2 className="h-4 w-4 shrink-0" aria-hidden />}
          {labels.confirmDelete}
        </Button>
      </div>
    </Modal>
  );
}
