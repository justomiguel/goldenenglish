"use client";

import { type FormEvent, useState } from "react";
import type { Dictionary, Locale } from "@/types/i18n";
import type { FileUploadProgressLabels } from "@/types/fileUploadProgressLabels";
import { formatStudentMonthlyPaymentAmount } from "@/components/student/studentMonthlyPaymentFocusFormatAmount";
import { StudentMonthlyPaymentReceiptUploadForm } from "@/components/student/StudentMonthlyPaymentReceiptUploadForm";
import type {
  StudentMonthlyPaymentCell,
  StudentMonthlyPaymentSectionRow,
} from "@/types/studentMonthlyPayments";
import { StudentMonthlyTutorPaymentMethodTabs } from "@/components/student/StudentMonthlyTutorPaymentMethodTabs";

type Labels = Dictionary["dashboard"]["student"]["monthly"];

export type SubmitMonthlyReceiptAction = (
  formData: FormData,
) => Promise<{ ok: boolean; message?: string }>;

export type StartFlowMonthlyPaymentClientAction = (
  formData: FormData,
) => Promise<{ ok: true; redirectUrl: string } | { ok: false; message: string }>;

export interface StudentMonthlyPaymentFocusProps {
  locale: Locale;
  /** Student being edited: self on student route; ward id on parent payments. */
  studentId: string;
  section: StudentMonthlyPaymentSectionRow;
  cell: StudentMonthlyPaymentCell;
  monthLabel: string;
  labels: Labels;
  /** Used in messages and the receipt link. */
  paymentLabels: Dictionary["dashboard"]["student"];
  /** Persists receipt; shared shape for student and tutor submit actions. */
  submitAction: SubmitMonthlyReceiptAction;
  /** Flow.cl online checkout (Chile / CLP only); server validates credentials. */
  startFlowAction?: StartFlowMonthlyPaymentClientAction;
  flowMonthlyPayEnabled?: boolean;
  fileUploadProgress: FileUploadProgressLabels;
  onSubmitted?: () => void;
  /** Full-month amount in receipt UI; server still resolves the slot amount. */
  receiptExpectedUsesFullMonth?: boolean;
  /** Tutor/parent payments: split receipt upload vs Flow in underline tabs inside this panel. */
  paymentMethodTabLayout?: boolean;
  /**
   * When true, render flush inside {@link StudentMonthlyPaymentsStrip}'s section card
   * (divider + inset surface) instead of a separate bordered card.
   */
  embeddedInSectionCard?: boolean;
}

export function StudentMonthlyPaymentFocus({
  locale,
  studentId,
  section,
  cell,
  monthLabel,
  labels,
  paymentLabels,
  submitAction,
  startFlowAction,
  flowMonthlyPayEnabled = false,
  fileUploadProgress,
  onSubmitted,
  receiptExpectedUsesFullMonth = false,
  paymentMethodTabLayout = false,
  embeddedInSectionCard = false,
}: StudentMonthlyPaymentFocusProps) {
  const [busy, setBusy] = useState(false);
  const [flowBusy, setFlowBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const proratedOrPlan =
    cell.expectedAmount ?? section.currentPlan?.monthlyFee ?? null;
  const expected = receiptExpectedUsesFullMonth
    ? (cell.fullMonthExpectedAmount ?? proratedOrPlan)
    : proratedOrPlan;
  const originalExpected = receiptExpectedUsesFullMonth
    ? (cell.fullMonthOriginalExpectedAmount ?? cell.originalExpectedAmount)
    : cell.originalExpectedAmount;
  const hasDiscountedExpected =
    expected != null &&
    originalExpected != null &&
    originalExpected > expected &&
    cell.scholarshipDiscountPercent != null;
  const recordedDisplayAmount = receiptExpectedUsesFullMonth
    ? (cell.fullMonthExpectedAmount ?? cell.recordedAmount)
    : cell.recordedAmount;
  const canUpload =
    cell.status === "due" || cell.status === "rejected" || cell.status === "pending";
  const isLocked = cell.status === "out-of-period" || cell.status === "no-plan";

  const isClp = (cell.currency ?? "").trim().toUpperCase() === "CLP";
  const showFlowPay =
    Boolean(flowMonthlyPayEnabled && startFlowAction && isClp && canUpload && expected != null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canUpload || expected == null) return;
    setBusy(true);
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    const res = await submitAction(fd);
    setBusy(false);
    setMsg(res.ok ? paymentLabels.paySuccess : `${paymentLabels.payError}: ${res.message ?? ""}`);
    if (res.ok && onSubmitted) onSubmitted();
  }

  async function onFlowPay() {
    if (!showFlowPay || !startFlowAction || expected == null) return;
    setFlowBusy(true);
    setMsg(null);
    const fd = new FormData();
    fd.set("locale", locale);
    fd.set("studentId", studentId);
    fd.set("sectionId", section.sectionId);
    fd.set("month", String(cell.month));
    fd.set("year", String(cell.year));
    fd.set("amount", String(expected));
    const res = await startFlowAction(fd);
    if (res.ok) {
      window.location.href = res.redirectUrl;
      return;
    }
    setFlowBusy(false);
    setMsg(res.message);
  }

  const outerClassName = embeddedInSectionCard
    ? "mt-3 -mx-4 border-t border-[var(--color-border)] bg-[var(--color-muted)]/20 px-4 py-4"
    : "mt-4 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]";

  return (
    <section className={outerClassName} aria-live="polite">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-lg font-semibold text-[var(--color-primary)]">
          {labels.focusTitle.replace("{month}", monthLabel).replace("{year}", String(cell.year))}
        </h3>
        {embeddedInSectionCard ? null : (
          <span className="text-sm text-[var(--color-muted-foreground)]">{section.sectionName}</span>
        )}
      </div>
      <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-[var(--color-muted-foreground)]">{labels.expectedAmount}</dt>
          <dd className="text-base font-medium text-[var(--color-foreground)]">
            {expected != null ? (
              <span className="inline-flex flex-wrap items-baseline gap-2">
                {hasDiscountedExpected ? (
                  <del className="text-sm font-normal text-[var(--color-muted-foreground)]">
                    {formatStudentMonthlyPaymentAmount(locale, originalExpected ?? 0, cell.currency)}
                  </del>
                ) : null}
                <span>{formatStudentMonthlyPaymentAmount(locale, expected, cell.currency)}</span>
              </span>
            ) : (
              labels.notAvailable
            )}
          </dd>
        </div>
        {recordedDisplayAmount != null ? (
          <div>
            <dt className="text-[var(--color-muted-foreground)]">{labels.recordedAmount}</dt>
            <dd className="text-base font-medium text-[var(--color-foreground)]">
              ${recordedDisplayAmount}
            </dd>
          </div>
        ) : null}
        {cell.receiptSignedUrl ? (
          <div className="sm:col-span-2">
            <dt className="text-[var(--color-muted-foreground)]">{paymentLabels.paymentViewReceipt}</dt>
            <dd>
              <a
                href={cell.receiptSignedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[var(--color-primary)] underline-offset-2 hover:underline"
              >
                {paymentLabels.paymentViewReceipt}
              </a>
            </dd>
          </div>
        ) : null}
      </dl>

      {isLocked ? (
        <p className="mt-4 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)] px-3 py-2 text-sm text-[var(--color-muted-foreground)]">
          {cell.status === "out-of-period" ? labels.lockedOutOfPeriod : labels.lockedNoPlan}
        </p>
      ) : null}

      {!isLocked && cell.status === "approved" ? (
        <p className="mt-4 rounded-[var(--layout-border-radius)] border border-[var(--color-success)]/40 bg-[var(--color-success)]/10 px-3 py-2 text-sm text-[var(--color-success)]">
          {labels.alreadyApproved}
        </p>
      ) : null}

      {!isLocked && cell.status === "exempt" ? (
        <p className="mt-4 rounded-[var(--layout-border-radius)] border border-[var(--color-info)]/40 bg-[var(--color-info)]/10 px-3 py-2 text-sm text-[var(--color-info)]">
          {labels.exemptHint}
        </p>
      ) : null}

      {canUpload && paymentMethodTabLayout ? (
        <StudentMonthlyTutorPaymentMethodTabs
          locale={locale}
          studentId={studentId}
          section={section}
          cell={cell}
          labels={labels}
          paymentLabels={paymentLabels}
          fileUploadProgress={fileUploadProgress}
          expected={expected}
          showFlowPay={showFlowPay}
          busy={busy}
          flowBusy={flowBusy}
          feedbackMessage={msg}
          onSubmitReceipt={onSubmit}
          onFlowPay={onFlowPay}
          compactTopSpacing={embeddedInSectionCard}
        />
      ) : canUpload ? (
        <StudentMonthlyPaymentReceiptUploadForm
          locale={locale}
          studentId={studentId}
          sectionId={section.sectionId}
          month={cell.month}
          year={cell.year}
          expected={expected}
          monthlyLabels={labels}
          paymentLabels={paymentLabels}
          fileUploadProgress={fileUploadProgress}
          busy={busy}
          flowBusy={flowBusy}
          showFlowPay={showFlowPay}
          feedbackMessage={msg}
          onSubmit={onSubmit}
          onFlowPay={onFlowPay}
        />
      ) : null}
    </section>
  );
}
