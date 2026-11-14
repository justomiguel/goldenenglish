"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Undo2, UserPlus } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { AdminRegistrationActionScene } from "@/components/dashboard/AdminRegistrationActionScene";
import { AdminRegistrationPersonCard } from "@/components/dashboard/AdminRegistrationPersonCard";
import { AdminRegistrationStepBlock } from "@/components/dashboard/AdminRegistrationStepBlock";
import { ConfirmActionModal } from "@/components/molecules/ConfirmActionModal";
import { moveRegistrationSectionAction } from "@/app/[locale]/dashboard/admin/registrations/moveRegistrationSectionAction";
import { revertEnrolledRegistrationAction } from "@/app/[locale]/dashboard/admin/registrations/revertEnrolledRegistrationAction";
import { registrationEnrolledRevert } from "@/lib/register/registrationEnrolledRevert";
import type { RegistrationWorkTask } from "@/hooks/useMarkContactedWithLoader";
import { registrationMatriculaFailureMessage } from "@/lib/register/registrationMatriculaAlta";
import type { RegistrationContactView } from "@/lib/register/resolveRegistrationContact";
import type { AdminRegistrationRow } from "@/types/adminRegistration";
import type { Dictionary } from "@/types/i18n";

type Labels = Dictionary["admin"]["registrations"];

export function AdminRegistrationEnrolledPanel({
  locale, row, labels, busy, sections, selectedCohortId, contact, onEdit, onDelete, onClose, onWork,
}: {
  locale: string;
  row: AdminRegistrationRow;
  labels: Labels;
  busy: boolean;
  sections: { id: string; label: string }[];
  selectedCohortId: string;
  contact?: RegistrationContactView | null;
  onEdit: (row: AdminRegistrationRow) => void;
  onDelete: (row: AdminRegistrationRow) => void;
  onClose: () => void;
  onWork: (task: RegistrationWorkTask) => void;
}) {
  const router = useRouter();
  const [sectionId, setSectionId] = useState("");
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
  const disabled = busy;

  function saveMove() {
    onWork(async () => {
      const result = await moveRegistrationSectionAction({
        locale,
        registrationId: row.id,
        sectionId,
        cohortId: selectedCohortId,
      });
      if (!result.ok) {
        return registrationMatriculaFailureMessage(result.code, labels.funnel.errors, labels.funnel.unknownError);
      }
      router.refresh();
      onClose();
      return null;
    });
  }

  function confirmRevert() {
    onWork(async () => {
      const result = await revertEnrolledRegistrationAction({
        locale,
        registrationId: row.id,
        cohortId: selectedCohortId,
      });
      if (!result.ok) {
        return registrationMatriculaFailureMessage(result.code, labels.funnel.errors, labels.funnel.unknownError);
      }
      router.refresh();
      onClose();
      return null;
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <AdminRegistrationPersonCard locale={locale} row={row} labels={labels} contact={contact} />
      <AdminRegistrationActionScene
        src="/images/dashboard/registration-enrolled.jpg"
        alt={labels.funnel.enrolledImageAlt}
        title={labels.funnel.enrolledChoose}
      >
        <p className="text-sm text-[var(--color-foreground)]">
          {labels.funnel.stepEnrolled.replaceAll("{{section}}", names)}
        </p>
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
      </AdminRegistrationActionScene>
      <AdminRegistrationStepBlock sentence={labels.funnel.enrolledSaveTip} infoLabel={labels.funnel.stepInfo} plain>
        <Button type="button" variant="success" className="min-h-11 w-full justify-start" disabled={disabled || !sectionId} onClick={saveMove}>
          <UserPlus className="h-4 w-4" aria-hidden />
          {labels.matricula.saveSection}
        </Button>
      </AdminRegistrationStepBlock>
      <div className="flex flex-col gap-2 border-t border-[var(--color-border)] pt-3">
        <div className="flex flex-row gap-2">
          <Button type="button" variant="primary" className="min-h-11 flex-1" disabled={disabled} onClick={() => { onClose(); onEdit(row); }}>
            <Pencil className="h-4 w-4" aria-hidden />
            {labels.editTitle}
          </Button>
          <Button type="button" variant="destructive" className="min-h-11 flex-1" disabled={disabled} onClick={() => { onClose(); onDelete(row); }}>
            <Trash2 className="h-4 w-4" aria-hidden />
            {labels.delete}
          </Button>
        </div>
        <Button type="button" variant="ghost" className="min-h-11 justify-start" disabled={disabled} onClick={() => setConfirmBack(true)}>
          <Undo2 className="h-4 w-4" aria-hidden />
          {labels.funnel.back}
        </Button>
      </div>
      <ConfirmActionModal
        open={confirmBack}
        onOpenChange={setConfirmBack}
        title={labels.funnel.backConfirmTitle}
        body={body}
        cancelLabel={labels.funnel.cancel}
        confirmLabel={labels.funnel.backConfirm}
        confirmVariant="destructive"
        onConfirm={confirmRevert}
      />
    </div>
  );
}
