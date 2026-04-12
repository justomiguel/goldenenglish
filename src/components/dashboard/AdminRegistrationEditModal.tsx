"use client";

import { Modal } from "@/components/atoms/Modal";
import { AdminRegistrationEditForm } from "@/components/dashboard/AdminRegistrationEditForm";
import type { AdminRegistrationRow } from "@/types/adminRegistration";
import type { Dictionary } from "@/types/i18n";

export interface AdminRegistrationEditModalProps {
  locale: string;
  row: AdminRegistrationRow | null;
  busy: boolean;
  onBusy: (id: string | null) => void;
  onClose: () => void;
  onSuccess: () => void;
  labels: Dictionary["admin"]["registrations"];
}

export function AdminRegistrationEditModal({
  locale,
  row,
  busy,
  onBusy,
  onClose,
  onSuccess,
  labels,
}: AdminRegistrationEditModalProps) {
  return (
    <Modal
      open={row !== null}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      titleId="reg-edit-title"
      descriptionId="reg-edit-desc"
      title={labels.editTitle}
    >
      <p id="reg-edit-desc" className="text-sm text-[var(--color-muted-foreground)]">
        {labels.editLead}
      </p>
      {row ? (
        <AdminRegistrationEditForm
          key={row.id}
          locale={locale}
          row={row}
          busy={busy}
          onBusy={onBusy}
          onClose={onClose}
          onSuccess={onSuccess}
          labels={labels}
        />
      ) : null}
    </Modal>
  );
}
