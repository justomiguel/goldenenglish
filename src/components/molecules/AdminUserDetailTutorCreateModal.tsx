"use client";

import { useEffect, useId, useState } from "react";
import { UserPlus, X } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import type { TutorStudentRelationshipCode } from "@/lib/register/tutorStudentRelationship";
import { Modal } from "@/components/atoms/Modal";
import { Button } from "@/components/atoms/Button";
import { FormField } from "@/components/molecules/FormField";
import { ConfirmActionModal } from "@/components/molecules/ConfirmActionModal";
import { AdminUserDetailTutorRelationshipSelect } from "@/components/molecules/AdminUserDetailTutorRelationshipSelect";
import {
  createAdminParentAndLinkStudentAction,
  type CreateAdminParentAndLinkStudentActionResult,
} from "@/app/[locale]/dashboard/admin/users/adminUserDetailActions";

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

function isReuseConfirmation(
  r: CreateAdminParentAndLinkStudentActionResult,
): r is Extract<CreateAdminParentAndLinkStudentActionResult, { needsConfirmation: true }> {
  return r.ok === false && "needsConfirmation" in r && r.needsConfirmation === true;
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
  const [relationship, setRelationship] = useState<TutorStudentRelationshipCode | "">("");
  const [busy, setBusy] = useState(false);
  const [reusePrompt, setReusePrompt] = useState<{
    reuseKind: "reused_parent" | "reused_admin";
    existingProfileId: string;
  } | null>(null);

  useEffect(() => {
    if (!open) {
      setDni("");
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setRelationship("");
      setBusy(false);
      setReusePrompt(null);
    }
  }, [open]);

  async function runSubmit(confirmReuseOfProfileId?: string) {
    if (!relationship) {
      onFeedback(labels.detailErrTutorRelationshipRequired, false);
      return;
    }
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
        relationship,
        ...(confirmReuseOfProfileId ? { confirmReuseOfProfileId } : {}),
      });
      if (r.ok) {
        setReusePrompt(null);
        onFeedback(r.message, true);
        onOpenChange(false);
        onLinked();
        return;
      }
      if (isReuseConfirmation(r)) {
        setReusePrompt({
          reuseKind: r.reuseKind,
          existingProfileId: r.existingProfileId,
        });
        return;
      }
      onFeedback(r.message, false);
    } finally {
      setBusy(false);
    }
  }

  const submitFirst = () => {
    setReusePrompt(null);
    void runSubmit();
  };

  const submitConfirmedReuse = () => {
    if (!reusePrompt) return;
    void runSubmit(reusePrompt.existingProfileId);
  };

  return (
    <>
      <Modal
        open={open}
        onOpenChange={onOpenChange}
        titleId={titleId}
        descriptionId={descId}
        title={labels.detailTutorCreateTitle}
        disableClose={busy || reusePrompt !== null}
        dialogClassName="max-w-lg"
      >
        <p id={descId} className="text-sm text-[var(--color-muted-foreground)]">
          {labels.detailTutorCreateLead}
        </p>
        <div className="mt-4 space-y-3">
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
          <AdminUserDetailTutorRelationshipSelect
            id="admin-tutor-create-relationship"
            value={relationship}
            onChange={setRelationship}
            labels={labels}
            disabled={busy}
            labelOverride={labels.detailTutorCreateRelationship}
            hintOverride={labels.detailTutorCreateRelationshipHint}
          />
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-[var(--color-border)] pt-4">
          <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 shrink-0" aria-hidden />
            {labels.detailTutorCreateCancel}
          </Button>
          <Button type="button" variant="primary" size="sm" isLoading={busy} onClick={() => void submitFirst()}>
            {!busy ? <UserPlus className="h-4 w-4 shrink-0" aria-hidden /> : null}
            {labels.detailTutorCreateSubmit}
          </Button>
        </div>
      </Modal>

      <ConfirmActionModal
        open={reusePrompt !== null}
        onOpenChange={(o) => {
          if (!o) setReusePrompt(null);
        }}
        title={labels.detailTutorCreateReuseConfirmTitle}
        description={
          reusePrompt?.reuseKind === "reused_admin"
            ? labels.detailTutorCreateReuseConfirmDescriptionAdmin
            : labels.detailTutorCreateReuseConfirmDescriptionParent
        }
        cancelLabel={labels.detailTutorCreateCancel}
        confirmLabel={labels.detailTutorCreateReuseConfirmButton}
        confirmVariant="primary"
        busy={busy}
        disableClose={busy}
        onConfirm={() => void submitConfirmedReuse()}
      />
    </>
  );
}
