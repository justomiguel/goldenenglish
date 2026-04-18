"use client";

import { type FormEvent, useState } from "react";
import { Button } from "@/components/atoms/Button";
import { Label } from "@/components/atoms/Label";
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
}: StudentMonthlyPaymentFocusProps) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const expected = cell.expectedAmount ?? section.currentPlan?.monthlyFee ?? null;
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
          <div>
            <Label htmlFor={`mp-file-${section.sectionId}-${cell.month}`}>
              {paymentLabels.payReceipt}
            </Label>
            <input
              id={`mp-file-${section.sectionId}-${cell.month}`}
              name="receipt"
              type="file"
              accept="image/*,application/pdf"
              required
              className="mt-1 block w-full min-h-[44px] text-sm"
            />
          </div>
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
