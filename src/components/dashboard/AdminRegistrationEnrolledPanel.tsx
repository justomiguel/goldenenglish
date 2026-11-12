"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Undo2, UserPlus } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { AdminRegistrationStepBlock } from "@/components/dashboard/AdminRegistrationStepBlock";
import { ConfirmActionModal } from "@/components/molecules/ConfirmActionModal";
import { moveRegistrationSectionAction } from "@/app/[locale]/dashboard/admin/registrations/moveRegistrationSectionAction";
import { revertEnrolledRegistrationAction } from "@/app/[locale]/dashboard/admin/registrations/revertEnrolledRegistrationAction";
import { registrationEnrolledRevert } from "@/lib/register/registrationEnrolledRevert";
import { registrationMatriculaFailureMessage } from "@/lib/register/registrationMatriculaAlta";
import type { AdminRegistrationRow } from "@/types/adminRegistration";
import type { Dictionary } from "@/types/i18n";

type Labels = Dictionary["admin"]["registrations"];

export function AdminRegistrationEnrolledPanel({
  locale, row, labels, busy, sections, selectedCohortId, onEdit, onDelete, onClose,
}: {
  locale: string;
  row: AdminRegistrationRow;
  labels: Labels;
  busy: boolean;
  sections: { id: string; label: string }[];
  selectedCohortId: string;
  onEdit: (row: AdminRegistrationRow) => void;
  onDelete: (row: AdminRegistrationRow) => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const [sectionId, setSectionId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [localBusy, setLocalBusy] = useState(false);
  const [confirmBack, setConfirmBack] = useState(false);
  const current = new Set(row.activeSectionNames ?? []);
  const choices = sections.filter((section) => !current.has(section.label));
  const names = (row.activeSectionNames ?? []).join(", ") || labels.emptyValue;
  const decision = registrationEnrolledRevert(row);
  const stageName = decision.ok
    ? {
        contacted: labels.funnel.stageContacted,
        awaiting_payment: labels.funnel.stageAwaitingPayment,
        awaiting_section: labels.funnel.stageAwaitingSection,
        registered: labels.funnel.stageRegistered,
        paid_without_section: labels.funnel.stagePaidWithoutSection,
        enrolled_in_section: labels.funnel.stageEnrolledInSection,
      }[decision.nextStage]
    : labels.funnel.stageAwaitingSection;
  const body = (decision.ok && decision.clearPayment
    ? labels.funnel.enrolledBackFeeBody
    : labels.funnel.enrolledBackNoFeeBody
  ).replaceAll("{{stage}}", stageName);
  const disabled = busy || localBusy;

  async function saveMove() {
    setLocalBusy(true);
    setError(null);
    const result = await moveRegistrationSectionAction({
      locale,
      registrationId: row.id,
      sectionId,
      cohortId: selectedCohortId,
    });
    setLocalBusy(false);
    if (!result.ok) {
      setError(registrationMatriculaFailureMessage(result.code, labels.funnel.errors, labels.funnel.unknownError));
      return;
    }
    router.refresh();
    onClose();
  }

  async function confirmRevert() {
    setLocalBusy(true);
    setError(null);
    const result = await revertEnrolledRegistrationAction({
      locale,
      registrationId: row.id,
      cohortId: selectedCohortId,
    });
    setLocalBusy(false);
    if (!result.ok) {
      setConfirmBack(false);
      setError(registrationMatriculaFailureMessage(result.code, labels.funnel.errors, labels.funnel.unknownError));
      return;
    }
    router.refresh();
    onClose();
  }

  return (
    <div className="flex flex-col gap-3">
      <AdminRegistrationStepBlock sentence={labels.funnel.stepEnrolled.replaceAll("{{section}}", names)}>
        <Button type="button" variant="stepCommit" className="min-h-11 w-full justify-start" disabled={disabled || !sectionId} onClick={() => void saveMove()}>
          <UserPlus className="h-4 w-4" aria-hidden />
          {labels.matricula.saveSection}
        </Button>
      </AdminRegistrationStepBlock>
      <label className="text-sm text-[var(--color-foreground)]" htmlFor={`enrolled-section-${row.id}`}>
        {labels.matricula.assignSection}
        <select
          id={`enrolled-section-${row.id}`}
          className="mt-1 min-h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm"
          value={sectionId}
          disabled={disabled}
          onChange={(event) => setSectionId(event.target.value)}
        >
          <option value="">{labels.matricula.assignPlaceholder}</option>
          {choices.map((section) => (
            <option key={section.id} value={section.id}>{section.label}</option>
          ))}
        </select>
      </label>
      {error ? <p className="text-sm text-[var(--color-error)]">{error}</p> : null}
      <div className="flex flex-col gap-2 border-t border-[var(--color-border)] pt-3">
        <Button type="button" variant="ghost" className="min-h-11 justify-start" disabled={disabled} onClick={() => { onClose(); onEdit(row); }}>
          <Pencil className="h-4 w-4" aria-hidden />
          {labels.editTitle}
        </Button>
        <Button type="button" variant="ghost" className="min-h-11 justify-start border border-[var(--color-error)] text-[var(--color-error)]" disabled={disabled} onClick={() => { onClose(); onDelete(row); }}>
          <Trash2 className="h-4 w-4" aria-hidden />
          {labels.delete}
        </Button>
        <Button type="button" variant="ghost" className="min-h-11 justify-start" disabled={disabled} onClick={() => setConfirmBack(true)}>
          <Undo2 className="h-4 w-4" aria-hidden />
          {labels.funnel.back}
        </Button>
        <Button type="button" variant="ghost" className="min-h-11 justify-start" onClick={onClose}>{labels.funnel.close}</Button>
      </div>
      <ConfirmActionModal
        open={confirmBack}
        onOpenChange={setConfirmBack}
        title={labels.funnel.backConfirmTitle}
        body={body}
        cancelLabel={labels.funnel.cancel}
        confirmLabel={labels.funnel.backConfirm}
        confirmVariant="destructive"
        busy={localBusy}
        onConfirm={() => void confirmRevert()}
      />
    </div>
  );
}
