"use client";

import { Modal } from "@/components/atoms/Modal";
import { AdminRegistrationFunnelPanel } from "@/components/dashboard/AdminRegistrationFunnelPanel";
import type { RegistrationWorkTask } from "@/hooks/useMarkContactedWithLoader";
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
  cycleStartsOn,
  cycleEndsOn,
  onEdit,
  onDelete,
  onMarkContacted,
  onStartEnrollmentFee,
  onWork,
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
  cycleStartsOn?: string | null;
  cycleEndsOn?: string | null;
  onEdit: (row: AdminRegistrationRow) => void;
  onDelete: (row: AdminRegistrationRow) => void;
  onMarkContacted: (row: AdminRegistrationRow) => void;
  onStartEnrollmentFee: (row: AdminRegistrationRow) => void;
  onWork: (task: RegistrationWorkTask) => void;
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
        cycleStartsOn={cycleStartsOn}
        cycleEndsOn={cycleEndsOn}
        contact={contact}
        onStartEnrollmentFee={onStartEnrollmentFee}
        onMarkContacted={onMarkContacted}
        onEdit={onEdit}
        onDelete={onDelete}
        onClose={() => onOpenChange(false)}
        onWork={onWork}
      />
    </Modal>
  );
}
