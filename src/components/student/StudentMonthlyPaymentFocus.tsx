"use client";

import { useState } from "react";
import type { Dictionary, Locale } from "@/types/i18n";
import type { FileUploadProgressLabels } from "@/types/fileUploadProgressLabels";
import { StudentMonthlyPaymentFocusAmounts } from "@/components/student/StudentMonthlyPaymentFocusAmounts";
import { StudentMonthlyPaymentReceiptUploadForm } from "@/components/student/StudentMonthlyPaymentReceiptUploadForm";
import type {
  StudentMonthlyPaymentCell,
  StudentMonthlyPaymentSectionRow,
} from "@/types/studentMonthlyPayments";
import { StudentMonthlyPaymentFocusApprovedNotice } from "@/components/student/StudentMonthlyPaymentFocusApprovedNotice";
import { StudentMonthlyTutorPaymentMethodTabs } from "@/components/student/StudentMonthlyTutorPaymentMethodTabs";
import { isAdvanceMonthlyPaymentAllowedForCell } from "@/lib/billing/assertAdvanceMonthlyPaymentAllowed";
import type { PaymentGatewayProvider } from "@/types/paymentGateway";
import { deriveMonthlyPaymentFocusState } from "@/lib/student/monthlyPaymentFocusDerived";

type Labels = Dictionary["dashboard"]["student"]["monthly"];

export type SubmitMonthlyReceiptAction = (
  formData: FormData,
) => Promise<{ ok: boolean; message?: string }>;

export type StartOnlineMonthlyPaymentClientAction = (
  formData: FormData,
) => Promise<{ ok: true; redirectUrl: string } | { ok: false; message: string }>;

/** @deprecated Use StartOnlineMonthlyPaymentClientAction */
export type StartFlowMonthlyPaymentClientAction = StartOnlineMonthlyPaymentClientAction;

export interface StudentMonthlyPaymentFocusProps {
  locale: Locale;
  studentId: string;
  section: StudentMonthlyPaymentSectionRow;
  cell: StudentMonthlyPaymentCell;
  monthLabel: string;
  labels: Labels;
  paymentLabels: Dictionary["dashboard"]["student"];
  submitAction: SubmitMonthlyReceiptAction;
  enabledOnlineGateways?: PaymentGatewayProvider[];
  startFlowAction?: StartOnlineMonthlyPaymentClientAction;
  startMercadoPagoAction?: StartOnlineMonthlyPaymentClientAction;
  fileUploadProgress: FileUploadProgressLabels;
  onSubmitted?: () => void;
  receiptExpectedUsesFullMonth?: boolean;
  paymentMethodTabLayout?: boolean;
  embeddedInSectionCard?: boolean;
  pwaNestedHierarchy?: boolean;
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
  enabledOnlineGateways = [],
  startFlowAction,
  startMercadoPagoAction,
  fileUploadProgress,
  onSubmitted,
  receiptExpectedUsesFullMonth = false,
  paymentMethodTabLayout = false,
  embeddedInSectionCard = false,
  pwaNestedHierarchy = false,
}: StudentMonthlyPaymentFocusProps) {
  const [busy, setBusy] = useState(false);
  const [onlineBusy, setOnlineBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const derived = deriveMonthlyPaymentFocusState({
    cell,
    section,
    receiptExpectedUsesFullMonth,
    enabledOnlineGateways,
    hasStartFlowAction: Boolean(startFlowAction),
    hasStartMercadoPagoAction: Boolean(startMercadoPagoAction),
  });

  const {
    expected,
    originalExpected,
    hasDiscountedExpected,
    recordedDisplayAmount,
    canUpload,
    isLocked,
    showOnlinePay,
  } = derived;

  const todayYear = new Date().getFullYear();
  const todayMonth = new Date().getMonth() + 1;
  const advanceAllowedFixed = isAdvanceMonthlyPaymentAllowedForCell(
    section.allowAdvanceMonthlyPayment,
    cell.year,
    cell.month,
    todayYear,
    todayMonth,
  );
  const canUploadEffective = canUpload && advanceAllowedFixed;
  const futureMonthBlocked = canUpload && !advanceAllowedFixed;
  const showOnlinePayEffective = showOnlinePay && canUploadEffective;

  async function onSubmit(fd: FormData) {
    if (!canUploadEffective || expected == null) return;
    setBusy(true);
    setMsg(null);
    const res = await submitAction(fd);
    setBusy(false);
    setMsg(res.ok ? paymentLabels.paySuccess : `${paymentLabels.payError}: ${res.message ?? ""}`);
    if (res.ok && onSubmitted) onSubmitted();
  }

  async function onOnlinePay(provider: PaymentGatewayProvider) {
    if (!showOnlinePayEffective || expected == null) return;
    const action = provider === "flow" ? startFlowAction : startMercadoPagoAction;
    if (!action) return;
    setOnlineBusy(true);
    setMsg(null);
    const fd = new FormData();
    fd.set("locale", locale);
    fd.set("studentId", studentId);
    fd.set("sectionId", section.sectionId);
    fd.set("month", String(cell.month));
    fd.set("year", String(cell.year));
    fd.set("amount", String(expected));
    const res = await action(fd);
    if (res.ok) {
      window.location.href = res.redirectUrl;
      return;
    }
    setOnlineBusy(false);
    setMsg(res.message);
  }

  const outerClassName = pwaNestedHierarchy
    ? "mt-0 p-0"
    : embeddedInSectionCard
      ? "mt-3 -mx-4 border-t border-[var(--color-border)] bg-[var(--color-muted)]/20 px-4 py-4"
      : "mt-4 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]";

  return (
    <section className={outerClassName} aria-live="polite">
      {pwaNestedHierarchy ? null : (
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-display text-lg font-semibold text-[var(--color-primary)]">
            {labels.focusTitle.replace("{month}", monthLabel).replace("{year}", String(cell.year))}
          </h3>
          {embeddedInSectionCard ? null : (
            <span className="text-sm text-[var(--color-muted-foreground)]">{section.sectionName}</span>
          )}
        </div>
      )}
      <StudentMonthlyPaymentFocusAmounts
        locale={locale}
        section={section}
        cell={cell}
        labels={labels}
        paymentLabels={paymentLabels}
        expected={expected}
        originalExpected={originalExpected}
        hasDiscountedExpected={hasDiscountedExpected}
        recordedDisplayAmount={recordedDisplayAmount}
        pwaNestedHierarchy={pwaNestedHierarchy}
      />

      {isLocked ? (
        <p className="mt-4 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)] px-3 py-2 text-sm text-[var(--color-muted-foreground)]">
          {cell.status === "out-of-period" ? labels.lockedOutOfPeriod : labels.lockedNoPlan}
        </p>
      ) : null}

      {!isLocked && cell.status === "approved" ? (
        <StudentMonthlyPaymentFocusApprovedNotice locale={locale} paymentId={cell.paymentId} labels={labels} />
      ) : null}

      {!isLocked && cell.status === "exempt" ? (
        <p className="mt-4 rounded-[var(--layout-border-radius)] border border-[var(--color-info)]/40 bg-[var(--color-info)]/10 px-3 py-2 text-sm text-[var(--color-info)]">
          {labels.exemptHint}
        </p>
      ) : null}

      {futureMonthBlocked ? (
        <p className="mt-4 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)] px-3 py-2 text-sm text-[var(--color-muted-foreground)]">
          {labels.advancePaymentBlocked}
        </p>
      ) : null}

      {canUploadEffective && paymentMethodTabLayout ? (
        <StudentMonthlyTutorPaymentMethodTabs
          key={`${section.sectionId}-${cell.year}-${cell.month}`}
          locale={locale}
          studentId={studentId}
          section={section}
          cell={cell}
          labels={labels}
          paymentLabels={paymentLabels}
          fileUploadProgress={fileUploadProgress}
          expected={expected}
          showOnlinePay={showOnlinePayEffective}
          enabledOnlineGateways={derived.enabledOnlineGateways}
          busy={busy}
          onlineBusy={onlineBusy}
          feedbackMessage={msg}
          onSubmitReceipt={onSubmit}
          onOnlinePay={onOnlinePay}
          compactTopSpacing={embeddedInSectionCard}
        />
      ) : canUploadEffective ? (
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
          onlineBusy={onlineBusy}
          showOnlinePay={showOnlinePayEffective}
          enabledOnlineGateways={derived.enabledOnlineGateways}
          feedbackMessage={msg}
          onSubmit={onSubmit}
          onOnlinePay={onOnlinePay}
        />
      ) : null}
    </section>
  );
}
