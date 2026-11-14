"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Undo2, UserPlus } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { AdminRegistrationContactChoice } from "@/components/dashboard/AdminRegistrationContactChoice";
import { AdminRegistrationLaterScene } from "@/components/dashboard/AdminRegistrationLaterScene";
import { AdminRegistrationPersonCard } from "@/components/dashboard/AdminRegistrationPersonCard";
import { AdminRegistrationStepBlock } from "@/components/dashboard/AdminRegistrationStepBlock";
import { ConfirmActionModal } from "@/components/molecules/ConfirmActionModal";
import { RegistrationContactMailForm } from "@/components/dashboard/RegistrationContactMailForm";
import { assignRegistrationCohortSectionAction } from "@/app/[locale]/dashboard/admin/registrations/assignRegistrationCohortSectionAction";
import { AdminRegistrationEnrolledPanel } from "@/components/dashboard/AdminRegistrationEnrolledPanel";
import { approveRegistrationReceiptAction } from "@/app/[locale]/dashboard/admin/registrations/registrationIntakeActions";
import { markRegistrationPaidInPersonAction } from "@/app/[locale]/dashboard/admin/registrations/markRegistrationPaidInPersonAction";
import { revertRegistrationFunnelStageAction } from "@/app/[locale]/dashboard/admin/registrations/revertRegistrationFunnelStageAction";
import type { JoinBillingDisposition } from "@/lib/billing/joinBillingDispositionSchema";
import { registrationFunnelRevert } from "@/lib/register/registrationFunnelRevert";
import { registrationFunnelStage } from "@/lib/register/registrationFunnelStage";
import {
  registrationMatriculaFailureMessage,
  registrationMatriculaLines,
} from "@/lib/register/registrationMatriculaAlta";
import { registrationTelHref } from "@/lib/register/registrationTelHref";
import type { RegistrationWorkTask } from "@/hooks/useMarkContactedWithLoader";
import type { RegistrationContactView } from "@/lib/register/resolveRegistrationContact";
import type { AdminRegistrationRow } from "@/types/adminRegistration";
import type { Dictionary } from "@/types/i18n";

type Labels = Dictionary["admin"]["registrations"];

export function AdminRegistrationFunnelPanel({
  locale, row, labels, busy, sections, contact, onStartEnrollmentFee, onMarkContacted, onEdit, onDelete, onClose,   onWork, selectedCohortId, cycleStartsOn, cycleEndsOn,
}: {
  locale: string;
  row: AdminRegistrationRow;
  labels: Labels;
  busy: boolean;
  sections: { id: string; label: string }[];
  contact: RegistrationContactView;
  onStartEnrollmentFee: (row: AdminRegistrationRow) => void;
  onMarkContacted: (row: AdminRegistrationRow) => void;
  onEdit: (row: AdminRegistrationRow) => void;
  onDelete: (row: AdminRegistrationRow) => void;
  onClose: () => void;
  onWork: (task: RegistrationWorkTask) => void;
  selectedCohortId?: string;
  cycleStartsOn?: string | null;
  cycleEndsOn?: string | null;
}) {
  const router = useRouter();
  const stage = row.status === "enrolled"
    ? "enrolled_in_section"
    : (registrationFunnelStage(row) ?? "registered");
  const sectionStage = stage === "paid_without_section" || stage === "awaiting_section";
  const paymentStage = stage === "contacted" || stage === "awaiting_payment";
  const [sectionId, setSectionId] = useState("");
  const [disposition, setDisposition] = useState<JoinBillingDisposition | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [confirmBack, setConfirmBack] = useState(false);
  const mail = row.tutor_email || row.email || "";
  const reverted = registrationFunnelRevert(row);
  const stageNames = {
    registered: labels.funnel.stageRegistered,
    contacted: labels.funnel.stageContacted,
    awaiting_payment: labels.funnel.stageAwaitingPayment,
    paid_without_section: labels.funnel.stagePaidWithoutSection,
    awaiting_section: labels.funnel.stageAwaitingSection,
    enrolled_in_section: labels.funnel.stageEnrolledInSection,
  };
  const backStageName = reverted.ok ? stageNames[reverted.nextStage] : labels.funnel.stageRegistered;
  const stepText = {
    registered: labels.funnel.stepRegistered,
    contacted: labels.funnel.stepContacted,
    awaiting_payment: labels.funnel.stepAwaitingPayment,
    paid_without_section: labels.funnel.stepPaid,
    awaiting_section: labels.funnel.stepAwaitingSection,
    enrolled_in_section: labels.funnel.stepEnrolled,
  }[stage];
  const digits = contact.tutor?.whatsAppDigits ?? contact.student?.whatsAppDigits ?? null;
  const callHref = registrationTelHref(contact.tutor?.phoneDisplay ?? contact.student?.phoneDisplay);
  const lines = registrationMatriculaLines(row);
  const lineText = {
    mercadopago: labels.matricula.paidMercadoPago,
    receipt_pending: labels.matricula.receiptPending,
    in_person: labels.matricula.paidInPerson,
    approved_without_section: labels.matricula.approvedWithoutSection,
  };

  function run(task: () => Promise<{ ok: true } | { ok: false; code: string }>) {
    onWork(async () => {
      const result = await task();
      if (!result.ok) {
        return registrationMatriculaFailureMessage(result.code, labels.matricula.errors, labels.matricula.unknownError);
      }
      router.refresh();
      onClose();
      return null;
    });
  }

  function confirmRevert() {
    onWork(async () => {
      const result = await revertRegistrationFunnelStageAction({ locale, registrationId: row.id });
      if (!result.ok) {
        return registrationMatriculaFailureMessage(result.code, labels.funnel.errors, labels.funnel.unknownError);
      }
      router.refresh();
      onClose();
      return null;
    });
  }

  const disabled = busy;
  if (stage === "enrolled_in_section") {
    return (
      <AdminRegistrationEnrolledPanel
        locale={locale}
        row={row}
        labels={labels}
        busy={busy}
        sections={sections}
        selectedCohortId={selectedCohortId ?? ""}
        onEdit={onEdit}
        onDelete={onDelete}
        onClose={onClose}
        onWork={onWork}
        contact={contact}
      />
    );
  }
  const ghostClass = "min-h-11 justify-start";
  const commitClass = "min-h-11 w-full justify-start";
  const markPaid = () => void run(() => markRegistrationPaidInPersonAction({ locale, registrationId: row.id }));
  return (
    <div className="flex flex-col gap-3">
      <AdminRegistrationPersonCard locale={locale} row={row} labels={labels} contact={contact} />
      {stage === "registered" ? (
        <div className="flex flex-col gap-2">
          <AdminRegistrationContactChoice
            labels={labels.funnel}
            infoLabel={labels.funnel.stepInfo}
            whatsAppLabel={labels.whatsappCta}
            callLabel={labels.funnel.callCta}
            disabled={disabled}
            whatsAppHref={digits ? `https://wa.me/${digits}` : null}
            callHref={callHref}
            onMail={() => setComposeOpen(true)}
          />
          {composeOpen ? (
            <RegistrationContactMailForm locale={locale} registrationId={row.id} toEmail={mail} labels={labels.funnel} disabled={disabled} onWork={onWork} />
          ) : null}
        </div>
      ) : null}
      {stage !== "registered" ? (
        <AdminRegistrationLaterScene
          stage={stage}
          rowId={row.id}
          locale={locale}
          labels={labels}
          disabled={disabled}
          sections={sections}
          sectionId={sectionId}
          onSectionId={setSectionId}
          disposition={disposition}
          onDisposition={setDisposition}
          cycleStartsOn={cycleStartsOn}
          cycleEndsOn={cycleEndsOn}
          onSendFee={() => onWork(async () => { await onStartEnrollmentFee(row); return null; })}
          onMarkPaid={markPaid}
          showReceipt={stage === "awaiting_payment" && Boolean(row.enrollmentFeeReceiptPath)}
          onApproveReceipt={() => void run(() => approveRegistrationReceiptAction({ locale, registrationId: row.id, joinDisposition: { kind: "behind" } }))}
        />
      ) : null}
      {stage === "registered" ? (
        <h3 className="text-sm font-medium text-[var(--color-foreground)]">{labels.funnel.afterTalk}</h3>
      ) : null}
      <AdminRegistrationStepBlock sentence={stepText} infoLabel={labels.funnel.stepInfo} plain>
        {stage === "registered" ? (
          <Button
            type="button"
            variant="success"
            className={commitClass}
            disabled={disabled}
            onClick={() => {
              onClose();
              void onMarkContacted(row);
            }}
          >
            <UserPlus className="h-4 w-4" aria-hidden />
            {labels.markContacted}
          </Button>
        ) : null}
        {sectionStage ? (
          <Button type="button" variant="success" className={commitClass} disabled={disabled || !sectionId} onClick={() => void run(() => assignRegistrationCohortSectionAction({ locale, registrationId: row.id, sectionId, joinDisposition: disposition ?? { kind: "behind" } }))}>
            <UserPlus className="h-4 w-4" aria-hidden />
            {labels.matricula.saveSection}
          </Button>
        ) : null}
        {stage === "contacted" ? (
          <p className="text-sm font-medium text-[var(--color-foreground)]">{labels.funnel.feeAfter}</p>
        ) : null}
        {stage === "awaiting_payment" ? (
          <p className="text-sm font-medium text-[var(--color-foreground)]">{labels.funnel.payAfter}</p>
        ) : null}
      </AdminRegistrationStepBlock>
      {paymentStage ? lines.filter((line) => line !== "approved_without_section").map((line) => (
        <p key={line} className="text-sm text-[var(--color-foreground)]">{lineText[line]}</p>
      )) : null}
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
        {stage !== "registered" ? (
          <Button type="button" variant="ghost" className={ghostClass} disabled={disabled} onClick={() => setConfirmBack(true)}>
            <Undo2 className="h-4 w-4" aria-hidden />
            {labels.funnel.back}
          </Button>
        ) : null}
      </div>
      <ConfirmActionModal
        open={confirmBack}
        onOpenChange={setConfirmBack}
        title={labels.funnel.backConfirmTitle}
        body={labels.funnel.backConfirmBody.replaceAll("{{stage}}", backStageName)}
        cancelLabel={labels.funnel.cancel}
        confirmLabel={labels.funnel.backConfirm}
        confirmVariant="destructive"
        onConfirm={confirmRevert}
      />
    </div>
  );
}
