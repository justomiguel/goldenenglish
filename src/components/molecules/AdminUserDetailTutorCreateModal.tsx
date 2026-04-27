"use client";

import { useEffect, useId, useState } from "react";
import { UserPlus, X } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { Modal } from "@/components/atoms/Modal";
import { Button } from "@/components/atoms/Button";
import { FormField } from "@/components/molecules/FormField";
import { createAdminParentAndLinkStudentAction } from "@/app/[locale]/dashboard/admin/users/adminUserDetailActions";

type UserLabels = Dictionary["admin"]["users"];

export interface AdminUserDetailTutorCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: string;
  studentId: string;
  labels: UserLabels;
  onFeedback: (message: string, ok: boolean) => void;
  onLinked: () => void;
}

export function AdminUserDetailTutorCreateModal({
  open,
  onOpenChange,
  locale,
  studentId,
  labels,
  onFeedback,
  onLinked,
}: AdminUserDetailTutorCreateModalProps) {
  const titleId = useId();
  const descId = useId();
  const [dni, setDni] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) {
      setDni("");
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setRelationship("");
      setBusy(false);
    }
  }, [open]);

  const submit = async () => {
    setBusy(true);
    try {
      const r = await createAdminParentAndLinkStudentAction({
        locale,
        studentId,
        tutorDni: dni,
        tutorFirstName: firstName,
        tutorLastName: lastName,
        tutorEmail: email.trim(),
        tutorPhone: phone.trim() || undefined,
        relationship: relationship.trim() || null,
      });
      if (r.ok) {
        onFeedback(r.message ?? labels.detailToastTutorCreatedLinked, true);
        onOpenChange(false);
        onLinked();
      } else {
        onFeedback(r.message ?? labels.detailErrSave, false);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      titleId={titleId}
      descriptionId={descId}
      title={labels.detailTutorCreateTitle}
      disableClose={busy}
      dialogClassName="max-w-lg"
    >
      <p id={descId} className="text-sm text-[var(--color-muted-foreground)]">
        {labels.detailTutorCreateLead}
      </p>
      <div className="mt-4 max-h-[min(70vh,32rem)] space-y-3 overflow-y-auto pr-1">
        <FormField
          label={labels.detailTutorCreateDni}
          value={dni}
          onChange={(e) => setDni(e.target.value)}
          autoComplete="off"
          required
          disabled={busy}
        />
        <FormField
          label={labels.detailTutorCreateFirstName}
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
          disabled={busy}
        />
        <FormField
          label={labels.detailTutorCreateLastName}
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
          disabled={busy}
        />
        <FormField
          label={labels.detailTutorCreateEmail}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={busy}
          hint={labels.detailTutorCreateEmailHint}
        />
        <FormField
          label={labels.detailTutorCreatePhone}
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={busy}
        />
        <FormField
          label={labels.detailTutorCreateRelationship}
          value={relationship}
          onChange={(e) => setRelationship(e.target.value)}
          disabled={busy}
          hint={labels.detailTutorCreateRelationshipHint}
        />
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-[var(--color-border)] pt-4">
        <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={() => onOpenChange(false)}>
          <X className="h-4 w-4 shrink-0" aria-hidden />
          {labels.detailTutorCreateCancel}
        </Button>
        <Button type="button" variant="primary" size="sm" isLoading={busy} onClick={() => void submit()}>
          {!busy ? <UserPlus className="h-4 w-4 shrink-0" aria-hidden /> : null}
          {labels.detailTutorCreateSubmit}
        </Button>
      </div>
    </Modal>
  );
}
