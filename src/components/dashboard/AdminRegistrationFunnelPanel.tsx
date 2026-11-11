"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Banknote, Mail, MessageCircle, Pencil, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { AdminRegistrationJoinBillingFields } from "@/components/dashboard/AdminRegistrationJoinBillingFields";
import { assignRegistrationCohortSectionAction } from "@/app/[locale]/dashboard/admin/registrations/assignRegistrationCohortSectionAction";
import { approveRegistrationReceiptAction } from "@/app/[locale]/dashboard/admin/registrations/registrationIntakeActions";
import { markRegistrationPaidInPersonAction } from "@/app/[locale]/dashboard/admin/registrations/markRegistrationPaidInPersonAction";
import type { JoinBillingDisposition } from "@/lib/billing/joinBillingDispositionSchema";
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
  locale, row, labels, busy, sections, contact, onStartEnrollmentFee, onMarkContacted, onEdit, onDelete, onClose,
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
}) {
  const router = useRouter();
  const stage = registrationFunnelStage(row) ?? "registered";
  const sectionStage = stage === "paid_without_section" || stage === "awaiting_section";
  const paymentStage = stage === "contacted" || stage === "awaiting_payment";
  const [sectionId, setSectionId] = useState("");
  const [disposition, setDisposition] = useState<JoinBillingDisposition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [localBusy, setLocalBusy] = useState(false);
  const mail = row.tutor_email || row.email;
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

  const disabled = busy || localBusy;
  return (
    <div className="flex flex-col gap-3">
      {stage === "registered" ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-[var(--color-foreground)]">{labels.funnel.contactTitle}</p>
          <a href={`mailto:${mail}`} className="inline-flex min-h-11 items-center gap-2 text-sm text-[var(--color-foreground)]">
            <Mail className="h-4 w-4" aria-hidden />
            {labels.funnel.sendMail}
          </a>
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
      {stage === "awaiting_payment" && row.enrollmentFeeReceiptPath ? (
        <Button type="button" variant="secondary" className="min-h-11 justify-start" disabled={disabled} onClick={() => void run(() => approveRegistrationReceiptAction({ locale, registrationId: row.id, joinDisposition: { kind: "behind" } }))}>
          <Mail className="h-4 w-4" aria-hidden />
          {labels.matricula.receiptPending}
        </Button>
      ) : null}
      {paymentStage ? (
        <Button type="button" variant="secondary" className="min-h-11 justify-start" disabled={disabled} onClick={() => void run(() => markRegistrationPaidInPersonAction({ locale, registrationId: row.id }))}>
          <Banknote className="h-4 w-4" aria-hidden />
          {labels.matricula.markInPerson}
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
      <div className="flex flex-col gap-2">
        <Button type="button" variant="secondary" className="min-h-11 justify-start" disabled={disabled} onClick={() => { onClose(); onEdit(row); }}>
          <Pencil className="h-4 w-4" aria-hidden />
          {labels.editTitle}
        </Button>
        <Button type="button" variant="secondary" className="min-h-11 justify-start border-[var(--color-error)] text-[var(--color-error)]" disabled={disabled} onClick={() => { onClose(); onDelete(row); }}>
          <Trash2 className="h-4 w-4" aria-hidden />
          {labels.delete}
        </Button>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {stage === "registered" ? (
          <Button type="button" className="min-h-11" disabled={disabled} onClick={() => onMarkContacted(row)}>
            <UserPlus className="h-4 w-4" aria-hidden />
            {labels.markContacted}
          </Button>
        ) : null}
        {paymentStage ? (
          <Button type="button" className="min-h-11" disabled={disabled} onClick={() => onStartEnrollmentFee(row)}>
            <Mail className="h-4 w-4" aria-hidden />
            {labels.matricula.sendMail}
          </Button>
        ) : null}
        {sectionStage ? (
          <Button type="button" className="min-h-11" disabled={disabled || !sectionId} onClick={() => void run(() => assignRegistrationCohortSectionAction({ locale, registrationId: row.id, sectionId, joinDisposition: disposition ?? { kind: "behind" } }))}>
            <UserPlus className="h-4 w-4" aria-hidden />
            {labels.matricula.saveSection}
          </Button>
        ) : null}
        <Button type="button" variant="ghost" className="min-h-11" onClick={onClose}>{labels.funnel.close}</Button>
      </div>
    </div>
  );
}
