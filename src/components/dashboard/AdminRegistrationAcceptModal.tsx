"use client";

import { Modal } from "@/components/atoms/Modal";
import { AdminRegistrationAcceptForm } from "@/components/dashboard/AdminRegistrationAcceptForm";
import type { AdminRegistrationRow } from "@/types/adminRegistration";
import type { Dictionary } from "@/types/i18n";
import type { RegistrationAcceptUserLabels } from "@/components/dashboard/AdminRegistrationAcceptForm";

interface AdminRegistrationAcceptModalProps {
  locale: string;
  row: AdminRegistrationRow | null;
  legalAgeMajority: number;
  busy: boolean;
  onBusy: (id: string | null) => void;
  onClose: () => void;
  onSuccess: () => void;
  labels: Dictionary["admin"]["registrations"];
  userLabels: RegistrationAcceptUserLabels;
}

export function AdminRegistrationAcceptModal({
  locale,
  row,
  legalAgeMajority,
  busy,
  onBusy,
  onClose,
  onSuccess,
  labels,
  userLabels,
}: AdminRegistrationAcceptModalProps) {
  return (
    <Modal
      open={row !== null}
      onOpenChange={(o) => {
        if (!o) {
          onClose();
        }
      }}
      titleId="reg-acc-title"
      descriptionId="reg-acc-desc"
      title={labels.acceptTitle}
    >
      <p id="reg-acc-desc" className="text-sm text-[var(--color-muted-foreground)]">
        {labels.acceptLead}{" "}
        <span className="mt-1 block text-pretty">{labels.acceptLeadMinor}</span>
      </p>
      {row ? (
        <AdminRegistrationAcceptForm
          key={row.id}
          locale={locale}
          row={row}
          legalAgeMajority={legalAgeMajority}
          busy={busy}
          onBusy={onBusy}
          onClose={onClose}
          onSuccess={onSuccess}
          labels={labels}
          userLabels={userLabels}
        />
      ) : null}
    </Modal>
  );
}
