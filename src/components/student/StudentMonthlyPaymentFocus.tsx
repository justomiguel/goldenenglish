"use client";

import { type FormEvent, useId, useState } from "react";
import { Button } from "@/components/atoms/Button";
import type { Dictionary, Locale } from "@/types/i18n";
import type {
  StudentMonthlyPaymentCell,
  StudentMonthlyPaymentSectionRow,
} from "@/types/studentMonthlyPayments";

type Labels = Dictionary["dashboard"]["student"]["monthly"];

export type SubmitMonthlyReceiptAction = (
  formData: FormData,
) => Promise<{ ok: boolean; message?: string }>;

export interface StudentMonthlyPaymentFocusProps {
  locale: Locale;
  /**
   * Alumno cuyo pago estamos editando. Cuando lo monta el propio alumno coincide
   * con el `auth.uid()`; cuando lo monta el tutor (`/dashboard/parent/payments`)
   * es el alumno vinculado y se manda como hidden field a `submitAction`.
   */
  studentId: string;
  section: StudentMonthlyPaymentSectionRow;
  cell: StudentMonthlyPaymentCell;
  monthLabel: string;
  labels: Labels;
  /** Used in messages and the receipt link. */
  paymentLabels: Dictionary["dashboard"]["student"];
  /**
   * Server action que persiste el comprobante. La firma se mantiene para que el
   * mismo componente sirva al alumno (`submitStudentPaymentReceipt`) y al tutor
   * (`submitTutorPaymentReceipt`); cada acción aplica su propia autorización.
   */
  submitAction: SubmitMonthlyReceiptAction;
  onSubmitted?: () => void;
  /**
   * When true, the alumno ve y declara el mes completo (fee + beca) en el panel
   * de comprobante; el servidor sigue persistiendo el monto operativo vía
   * `resolveStudentPaymentSlot`. El tutor mantiene el default (prorrateo).
   */
  receiptExpectedUsesFullMonth?: boolean;
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
  onSubmitted,
  receiptExpectedUsesFullMonth = false,
}: StudentMonthlyPaymentFocusProps) {
  const receiptInputId = useId();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [receiptFileName, setReceiptFileName] = useState<string | null>(null);

  const proratedOrPlan =
    cell.expectedAmount ?? section.currentPlan?.monthlyFee ?? null;
  const expected = receiptExpectedUsesFullMonth
    ? (cell.fullMonthExpectedAmount ?? proratedOrPlan)
    : proratedOrPlan;
  const canUpload =
    cell.status === "due" || cell.status === "rejected" || cell.status === "pending";
  const isLocked = cell.status === "out-of-period" || cell.status === "no-plan";

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

  return (
    <section
      className="mt-4 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]"
      aria-live="polite"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-lg font-semibold text-[var(--color-primary)]">
          {labels.focusTitle.replace("{month}", monthLabel).replace("{year}", String(cell.year))}
        </h3>
        <span className="text-sm text-[var(--color-muted-foreground)]">{section.sectionName}</span>
      </div>
      <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-[var(--color-muted-foreground)]">{labels.expectedAmount}</dt>
          <dd className="text-base font-medium text-[var(--color-foreground)]">
            {expected != null ? `$${expected}` : labels.notAvailable}
          </dd>
        </div>
        {cell.recordedAmount != null ? (
          <div>
            <dt className="text-[var(--color-muted-foreground)]">{labels.recordedAmount}</dt>
            <dd className="text-base font-medium text-[var(--color-foreground)]">
              ${cell.recordedAmount}
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

      {canUpload ? (
        <form
          onSubmit={onSubmit}
          className="mt-4 space-y-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-4"
        >
          <input type="hidden" name="locale" value={locale} readOnly />
          <input type="hidden" name="studentId" value={studentId} readOnly />
          <input type="hidden" name="sectionId" value={section.sectionId} readOnly />
          <input type="hidden" name="month" value={cell.month} readOnly />
          <input type="hidden" name="year" value={cell.year} readOnly />
          <input
            type="hidden"
            name="amount"
            value={expected != null ? String(expected) : ""}
            readOnly
          />
          <fieldset className="min-w-0 border-0 p-0">
            <legend className="text-sm font-semibold text-[var(--color-foreground)]">
              {paymentLabels.payReceipt}
            </legend>
            <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
              {paymentLabels.payReceiptHint}
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <input
                id={receiptInputId}
                name="receipt"
                type="file"
                accept="image/*,application/pdf"
                required
                aria-label={paymentLabels.payReceipt}
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  setReceiptFileName(f?.name ?? null);
                }}
              />
              <label
                htmlFor={receiptInputId}
                className="inline-flex min-h-[44px] w-full cursor-pointer items-center justify-center rounded-[var(--layout-border-radius)] border-2 border-[var(--color-primary)] bg-[var(--color-background)] px-4 py-2 text-center text-sm font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-muted)] focus-within:outline-none focus-within:ring-2 focus-within:ring-[var(--color-primary)] focus-within:ring-offset-2 sm:w-auto"
              >
                {paymentLabels.payReceiptChooseButton}
              </label>
              <p
                className="text-sm text-[var(--color-muted-foreground)] sm:min-h-[44px] sm:flex sm:max-w-[min(100%,20rem)] sm:items-center"
                aria-live="polite"
              >
                <span className="break-all font-medium text-[var(--color-foreground)]">
                  {receiptFileName ?? paymentLabels.payReceiptNoFileSelected}
                </span>
              </p>
            </div>
          </fieldset>
          <Button
            type="submit"
            disabled={busy || expected == null}
            isLoading={busy}
            className="min-h-[44px] w-full sm:w-auto"
          >
            {paymentLabels.paySubmit}
          </Button>
          {msg ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">{msg}</p>
          ) : null}
        </form>
      ) : null}
    </section>
  );
}
