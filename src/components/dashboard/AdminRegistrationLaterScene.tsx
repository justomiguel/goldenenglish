import { Banknote, Check, Mail } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { AdminRegistrationActionScene } from "@/components/dashboard/AdminRegistrationActionScene";
import { AdminRegistrationReceiptLink } from "@/components/dashboard/AdminRegistrationReceiptLink";
import { AdminRegistrationChoiceRow } from "@/components/dashboard/AdminRegistrationChoiceRow";
import { AdminRegistrationJoinBillingFields } from "@/components/dashboard/AdminRegistrationJoinBillingFields";
import type { JoinBillingDisposition } from "@/lib/billing/joinBillingDispositionSchema";
import type { RegistrationFunnelStage } from "@/lib/register/registrationFunnelStage";
import type { Dictionary } from "@/types/i18n";

type Labels = Dictionary["admin"]["registrations"];
type LaterStage = Exclude<RegistrationFunnelStage, "registered" | "enrolled_in_section">;

const commitClass = "min-h-11 w-full justify-start";
const orClass = "text-center text-sm font-medium text-[var(--color-muted-foreground)]";

export function AdminRegistrationLaterScene({
  stage,
  rowId,
  locale,
  labels,
  disabled,
  sections,
  sectionId,
  onSectionId,
  disposition,
  onDisposition,
  cycleStartsOn,
  cycleEndsOn,
  onSendFee,
  onMarkPaid,
  showReceipt,
  onApproveReceipt,
}: {
  stage: LaterStage;
  rowId: string;
  locale: string;
  labels: Labels;
  disabled: boolean;
  sections: { id: string; label: string }[];
  sectionId: string;
  onSectionId: (value: string) => void;
  disposition: JoinBillingDisposition | null;
  onDisposition: (value: JoinBillingDisposition | null) => void;
  cycleStartsOn?: string | null;
  cycleEndsOn?: string | null;
  onSendFee: () => void;
  onMarkPaid: () => void;
  showReceipt: boolean;
  onApproveReceipt: () => void;
}) {
  const info = labels.funnel.stepInfo;
  const orLabel = labels.funnel.contactOr;
  if (stage === "contacted") {
    return (
      <AdminRegistrationActionScene
        src="/images/dashboard/registration-fee.jpg"
        alt={labels.funnel.feeImageAlt}
        title={labels.funnel.feeChoose}
      >
        <AdminRegistrationChoiceRow tip={labels.funnel.feeMailTip} infoLabel={info}>
          <Button type="button" variant="success" className={commitClass} disabled={disabled} onClick={onSendFee}>
            <Mail className="h-4 w-4" aria-hidden />
            {labels.matricula.sendMail}
          </Button>
        </AdminRegistrationChoiceRow>
        <span className={orClass}>{orLabel}</span>
        <AdminRegistrationChoiceRow tip={labels.funnel.paidHereTip} infoLabel={info}>
          <Button type="button" variant="secondary" className={commitClass} disabled={disabled} onClick={onMarkPaid}>
            <Banknote className="h-4 w-4" aria-hidden />
            {labels.matricula.markInPerson}
          </Button>
        </AdminRegistrationChoiceRow>
      </AdminRegistrationActionScene>
    );
  }
  if (stage === "awaiting_payment") {
    return (
      <AdminRegistrationActionScene
        src="/images/dashboard/registration-payment.jpg"
        alt={labels.funnel.payImageAlt}
        title={labels.funnel.payChoose}
      >
        <AdminRegistrationChoiceRow tip={labels.funnel.paidHereTip} infoLabel={info}>
          <Button type="button" variant="success" className={commitClass} disabled={disabled} onClick={onMarkPaid}>
            <Banknote className="h-4 w-4" aria-hidden />
            {labels.matricula.markInPerson}
          </Button>
        </AdminRegistrationChoiceRow>
        <span className={orClass}>{orLabel}</span>
        <AdminRegistrationChoiceRow tip={labels.funnel.resendFeeTip} infoLabel={info}>
          <Button type="button" variant="secondary" className={commitClass} disabled={disabled} onClick={onSendFee}>
            <Mail className="h-4 w-4" aria-hidden />
            {labels.matricula.sendMail}
          </Button>
        </AdminRegistrationChoiceRow>
        {showReceipt ? (
          <>
            <span className={orClass}>{orLabel}</span>
            <AdminRegistrationReceiptLink registrationId={rowId} label={labels.intake.viewReceipt} />
            <AdminRegistrationChoiceRow tip={labels.funnel.receiptTip} infoLabel={info}>
              <Button type="button" variant="secondary" className={commitClass} disabled={disabled} onClick={onApproveReceipt}>
                <Check className="h-4 w-4" aria-hidden />
                {labels.matricula.receiptPending}
              </Button>
            </AdminRegistrationChoiceRow>
          </>
        ) : null}
      </AdminRegistrationActionScene>
    );
  }
  const waiting = stage === "awaiting_section";
  return (
    <AdminRegistrationActionScene
      src={waiting ? "/images/dashboard/registration-section.jpg" : "/images/dashboard/registration-seat.jpg"}
      alt={waiting ? labels.funnel.waitImageAlt : labels.funnel.seatImageAlt}
      title={waiting ? labels.funnel.waitChoose : labels.funnel.seatChoose}
    >
      <label className="text-sm text-[var(--color-foreground)]" htmlFor={`funnel-section-${rowId}`}>
        {labels.matricula.assignSection}
      </label>
      <select
        id={`funnel-section-${rowId}`}
        className="min-h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm"
        value={sectionId}
        disabled={disabled}
        onChange={(event) => onSectionId(event.target.value)}
      >
        <option value="">{labels.matricula.assignPlaceholder}</option>
        {sections.map((section) => (
          <option key={section.id} value={section.id}>{section.label}</option>
        ))}
      </select>
      <AdminRegistrationJoinBillingFields
        locale={locale}
        namePrefix={`funnel-${rowId}`}
        value={disposition}
        onChange={onDisposition}
        labels={labels.joinBilling}
        cycleStartsOn={cycleStartsOn}
        cycleEndsOn={cycleEndsOn}
      />
    </AdminRegistrationActionScene>
  );
}
