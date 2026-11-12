"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Banknote, Mail, MessageCircle, Pencil, Trash2, Undo2, UserPlus } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { AdminRegistrationStepBlock } from "@/components/dashboard/AdminRegistrationStepBlock";
import { ConfirmActionModal } from "@/components/molecules/ConfirmActionModal";
import { AdminRegistrationJoinBillingFields } from "@/components/dashboard/AdminRegistrationJoinBillingFields";
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
import type { RegistrationContactView } from "@/lib/register/resolveRegistrationContact";
import type { AdminRegistrationRow } from "@/types/adminRegistration";
import type { Dictionary } from "@/types/i18n";

type Labels = Dictionary["admin"]["registrations"];

export function AdminRegistrationFunnelPanel({
  locale, row, labels, busy, sections, contact, onStartEnrollmentFee, onMarkContacted, onEdit, onDelete, onClose, selectedCohortId,
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
  selectedCohortId?: string;
}) {
  const router = useRouter();
  const stage = row.status === "enrolled"
    ? "enrolled_in_section"
    : (registrationFunnelStage(row) ?? "registered");
  const sectionStage = stage === "paid_without_section" || stage === "awaiting_section";
  const paymentStage = stage === "contacted" || stage === "awaiting_payment";
  const [sectionId, setSectionId] = useState("");
  const [disposition, setDisposition] = useState<JoinBillingDisposition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [localBusy, setLocalBusy] = useState(false);
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
  const lines = registrationMatriculaLines(row);
  const lineText = {
    mercadopago: labels.matricula.paidMercadoPago,
    receipt_pending: labels.matricula.receiptPending,
    in_person: labels.matricula.paidInPerson,
    approved_without_section: labels.matricula.approvedWithoutSection,
  };

  async function run(task: () => Promise<{ ok: true } | { ok: false; code: string }>) {
    setLocalBusy(true);
    setError(null);
    const result = await task();
    setLocalBusy(false);
    if (!result.ok) {
      setError(registrationMatriculaFailureMessage(result.code, labels.matricula.errors, labels.matricula.unknownError));
      return;
    }
    router.refresh();
    onClose();
  }

  async function confirmRevert() {
    setLocalBusy(true);
    setError(null);
    const result = await revertRegistrationFunnelStageAction({ locale, registrationId: row.id });
    setLocalBusy(false);
    if (!result.ok) {
      setConfirmBack(false);
      setError(registrationMatriculaFailureMessage(result.code, labels.funnel.errors, labels.funnel.unknownError));
      return;
    }
    router.refresh();
    onClose();
  }

  const disabled = busy || localBusy;
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
      />
    );
  }
  const ghostClass = "min-h-11 justify-start";
  const commitClass = "min-h-11 w-full justify-start";
  const markPaid = () => void run(() => markRegistrationPaidInPersonAction({ locale, registrationId: row.id }));
  return (
    <div className="flex flex-col gap-3">
      <AdminRegistrationStepBlock sentence={stepText}>
        {stage === "registered" ? (
          <Button type="button" variant="stepCommit" className={commitClass} disabled={disabled} onClick={() => onMarkContacted(row)}>
            <UserPlus className="h-4 w-4" aria-hidden />
            {labels.markContacted}
          </Button>
        ) : null}
        {stage === "contacted" ? (
          <Button type="button" variant="stepCommit" className={commitClass} disabled={disabled} onClick={() => onStartEnrollmentFee(row)}>
            <Mail className="h-4 w-4" aria-hidden />
            {labels.matricula.sendMail}
          </Button>
        ) : null}
        {stage === "awaiting_payment" ? (
          <Button type="button" variant="stepCommit" className={commitClass} disabled={disabled} onClick={markPaid}>
            <Banknote className="h-4 w-4" aria-hidden />
            {labels.matricula.markInPerson}
          </Button>
        ) : null}
        {sectionStage ? (
          <Button type="button" variant="stepCommit" className={commitClass} disabled={disabled || !sectionId} onClick={() => void run(() => assignRegistrationCohortSectionAction({ locale, registrationId: row.id, sectionId, joinDisposition: disposition ?? { kind: "behind" } }))}>
            <UserPlus className="h-4 w-4" aria-hidden />
            {labels.matricula.saveSection}
          </Button>
        ) : null}
      </AdminRegistrationStepBlock>
      {stage === "registered" ? (
        <div className="flex flex-col gap-2">
          <Button type="button" variant="ghost" className={ghostClass} disabled={disabled} onClick={() => setComposeOpen(true)}>
            <Mail className="h-4 w-4" aria-hidden />
            {labels.funnel.sendMail}
          </Button>
          {composeOpen ? (
            <RegistrationContactMailForm locale={locale} registrationId={row.id} toEmail={mail} labels={labels.funnel} disabled={disabled} />
          ) : null}
          {digits ? (
            <a href={`https://wa.me/${digits}`} className="inline-flex min-h-11 items-center gap-2 text-sm text-[var(--color-foreground)]">
              <MessageCircle className="h-4 w-4" aria-hidden />
              {labels.whatsappCta}
            </a>
          ) : null}
        </div>
      ) : null}
      {paymentStage ? lines.map((line) => (
        <p key={line} className="text-sm text-[var(--color-foreground)]">{lineText[line]}</p>
      )) : null}
      {stage === "contacted" ? (
        <Button type="button" variant="ghost" className={ghostClass} disabled={disabled} onClick={markPaid}>
          <Banknote className="h-4 w-4" aria-hidden />
          {labels.matricula.markInPerson}
        </Button>
      ) : null}
      {stage === "awaiting_payment" ? (
        <Button type="button" variant="ghost" className={ghostClass} disabled={disabled} onClick={() => onStartEnrollmentFee(row)}>
          <Mail className="h-4 w-4" aria-hidden />
          {labels.matricula.sendMail}
        </Button>
      ) : null}
      {stage === "awaiting_payment" && row.enrollmentFeeReceiptPath ? (
        <Button type="button" variant="ghost" className={ghostClass} disabled={disabled} onClick={() => void run(() => approveRegistrationReceiptAction({ locale, registrationId: row.id, joinDisposition: { kind: "behind" } }))}>
          <Mail className="h-4 w-4" aria-hidden />
          {labels.matricula.receiptPending}
        </Button>
      ) : null}
      {sectionStage ? (
        <div className="flex flex-col gap-2">
          <label className="text-sm text-[var(--color-foreground)]" htmlFor={`funnel-section-${row.id}`}>{labels.matricula.assignSection}</label>
          <select id={`funnel-section-${row.id}`} className="min-h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm" value={sectionId} disabled={disabled} onChange={(event) => setSectionId(event.target.value)}>
            <option value="">{labels.matricula.assignPlaceholder}</option>
            {sections.map((section) => <option key={section.id} value={section.id}>{section.label}</option>)}
          </select>
          <AdminRegistrationJoinBillingFields locale={locale} namePrefix={`funnel-${row.id}`} value={disposition} onChange={setDisposition} labels={labels.joinBilling} />
        </div>
      ) : null}
      {error ? <p className="text-sm text-[var(--color-error)]">{error}</p> : null}
      <div className="flex flex-col gap-2 border-t border-[var(--color-border)] pt-3">
        <Button type="button" variant="ghost" className={ghostClass} disabled={disabled} onClick={() => { onClose(); onEdit(row); }}>
          <Pencil className="h-4 w-4" aria-hidden />
          {labels.editTitle}
        </Button>
        <Button type="button" variant="ghost" className={`${ghostClass} border border-[var(--color-error)] text-[var(--color-error)]`} disabled={disabled} onClick={() => { onClose(); onDelete(row); }}>
          <Trash2 className="h-4 w-4" aria-hidden />
          {labels.delete}
        </Button>
        {stage !== "registered" ? (
          <Button type="button" variant="ghost" className={ghostClass} disabled={disabled} onClick={() => setConfirmBack(true)}>
            <Undo2 className="h-4 w-4" aria-hidden />
            {labels.funnel.back}
          </Button>
        ) : null}
        <Button type="button" variant="ghost" className={ghostClass} onClick={onClose}>{labels.funnel.close}</Button>
      </div>
      <ConfirmActionModal
        open={confirmBack}
        onOpenChange={setConfirmBack}
        title={labels.funnel.backConfirmTitle}
        body={labels.funnel.backConfirmBody.replaceAll("{{stage}}", backStageName)}
        cancelLabel={labels.funnel.cancel}
        confirmLabel={labels.funnel.backConfirm}
        confirmVariant="destructive"
        busy={localBusy}
        onConfirm={() => void confirmRevert()}
      />
    </div>
  );
}
