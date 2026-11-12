"use client";

import { Modal } from "@/components/atoms/Modal";
import { AdminRegistrationFunnelPanel } from "@/components/dashboard/AdminRegistrationFunnelPanel";
import type { RegistrationContactView } from "@/lib/register/resolveRegistrationContact";
import type { Dictionary } from "@/types/i18n";
import type { AdminRegistrationRow } from "@/types/adminRegistration";

type RegLabels = Dictionary["admin"]["registrations"];

export function AdminRegistrationActionsSheet({
  open,
  onOpenChange,
  locale,
  row,
  busy,
  labels,
  contact,
  sections,
  selectedCohortId,
  onEdit,
  onDelete,
  onMarkContacted,
  onStartEnrollmentFee,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: string;
  row: AdminRegistrationRow;
  busy: boolean;
  labels: RegLabels;
  contact: RegistrationContactView;
  sections: { id: string; label: string }[];
  selectedCohortId?: string;
  onEdit: (row: AdminRegistrationRow) => void;
  onDelete: (row: AdminRegistrationRow) => void;
  onMarkContacted: (row: AdminRegistrationRow) => void;
  onStartEnrollmentFee: (row: AdminRegistrationRow) => void;
}) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      titleId={`admin-registration-actions-${row.id}`}
      title={labels.funnel.actions}
      stackBelowTour
    >
      <AdminRegistrationFunnelPanel
        locale={locale}
        row={row}
        labels={labels}
        busy={busy}
        sections={sections}
        selectedCohortId={selectedCohortId}
        contact={contact}
        onStartEnrollmentFee={onStartEnrollmentFee}
        onMarkContacted={onMarkContacted}
        onEdit={onEdit}
        onDelete={onDelete}
        onClose={() => onOpenChange(false)}
      />
    </Modal>
  );
}
