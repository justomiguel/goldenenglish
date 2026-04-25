"use client";

import { useMemo, useState } from "react";
import { Tag } from "lucide-react";
import { useRouter } from "next/navigation";
import { StudentMonthlyPaymentCell } from "@/components/student/StudentMonthlyPaymentCell";
import {
  StudentMonthlyPaymentFocus,
  type SubmitMonthlyReceiptAction,
} from "@/components/student/StudentMonthlyPaymentFocus";
import {
  StudentEnrollmentFeeUpload,
  type SubmitEnrollmentFeeReceiptAction,
} from "@/components/molecules/StudentEnrollmentFeeUpload";
import type { Dictionary, Locale } from "@/types/i18n";
import type {
  StudentMonthlyPaymentsView,
  StudentMonthlyPaymentSectionRow,
} from "@/types/studentMonthlyPayments";

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

interface FocusKey {
  sectionId: string;
  month: number;
}

function pickInitialFocus(view: StudentMonthlyPaymentsView): FocusKey | null {
  if (view.rows.length === 0) return null;
  const first = view.rows[0];
  return { sectionId: first.sectionId, month: view.todayMonth };
}

function monthLabel(locale: Locale, month: number): string {
  const date = new Date(2000, month - 1, 1);
  const formatter = new Intl.DateTimeFormat(locale, { month: "short" });
  return formatter.format(date);
}

function formatEnrollmentFee(
  locale: Locale,
  amount: number,
  currency: string | null,
): string {
  if (!Number.isFinite(amount) || amount <= 0) return "";
  if (currency) {
    try {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      // Fall through to non-currency formatting if the ISO code is unknown.
    }
  }
  const numeric = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
  }).format(amount);
  return currency ? `${currency} ${numeric}` : numeric;
}

function findCell(section: StudentMonthlyPaymentSectionRow, month: number) {
  return section.cells.find((c) => c.month === month) ?? null;
}

export interface StudentMonthlyPaymentsStripProps {
  locale: Locale;
  /**
   * Alumno cuya tira se está renderizando. Cuando lo monta el propio alumno
   * coincide con `auth.uid()`; cuando lo monta el tutor desde
   * `/dashboard/parent/payments` es el alumno vinculado seleccionado.
   */
  studentId: string;
  view: StudentMonthlyPaymentsView;
  labels: Dictionary["dashboard"]["student"]["monthly"];
  paymentLabels: Dictionary["dashboard"]["student"];
  /** Server action que persiste el comprobante mensual para `studentId`. */
  submitAction: SubmitMonthlyReceiptAction;
  /** Server action que persiste el comprobante de matrícula para `studentId`. */
  submitEnrollmentFeeReceiptAction: SubmitEnrollmentFeeReceiptAction;
  /** Solo alumno: monto esperado del comprobante = mes completo (sin prorrateo). */
  receiptExpectedUsesFullMonth?: boolean;
}

export function StudentMonthlyPaymentsStrip({
  locale,
  studentId,
  view,
  labels,
  paymentLabels,
  submitAction,
  submitEnrollmentFeeReceiptAction,
  receiptExpectedUsesFullMonth = false,
}: StudentMonthlyPaymentsStripProps) {
  const router = useRouter();
  const [focus, setFocus] = useState<FocusKey | null>(() => pickInitialFocus(view));

  const monthLabels = useMemo(() => MONTHS.map((m) => monthLabel(locale, m)), [locale]);

  if (view.rows.length === 0) {
    return (
      <section className="mt-6 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-sm text-[var(--color-muted-foreground)]">
        {labels.emptySections}
      </section>
    );
  }

  const focusedSection = focus
    ? view.rows.find((r) => r.sectionId === focus.sectionId) ?? null
    : null;
  const focusedCell = focusedSection && focus ? findCell(focusedSection, focus.month) : null;

  return (
    <section className="mt-6 space-y-6" aria-label={labels.stripAria}>
      {view.rows.map((row) => {
        const isFocusedSection = focus?.sectionId === row.sectionId;
        return (
          <div
            key={row.sectionId}
            className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]"
          >
            <header className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h2 className="font-display text-lg font-semibold text-[var(--color-secondary)]">
                  {row.sectionName}
                </h2>
                {row.cohortName ? (
                  <p className="text-xs text-[var(--color-muted-foreground)]">{row.cohortName}</p>
                ) : null}
              </div>
              {row.enrollmentFeeAmount > 0 ? (() => {
                const formatted = formatEnrollmentFee(
                  locale,
                  row.enrollmentFeeAmount,
                  row.enrollmentFeeCurrency,
                );
                return (
                  <span
                    className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-muted)] px-2 py-0.5 text-xs font-medium text-[var(--color-foreground)]"
                    title={labels.enrollmentFeeTooltip.replace("{amount}", formatted)}
                  >
                    <Tag className="h-3 w-3" aria-hidden />
                    {labels.enrollmentFeeBadge.replace("{amount}", formatted)}
                  </span>
                );
              })() : null}
            </header>
            <div
              role="grid"
              aria-label={`${row.sectionName} ${labels.stripAria}`}
              className="grid grid-cols-6 gap-2 sm:grid-cols-12"
            >
              {row.cells.map((cell) => (
                <StudentMonthlyPaymentCell
                  key={`${row.sectionId}-${cell.month}`}
                  cell={cell}
                  monthLabel={monthLabels[cell.month - 1]}
                  labels={labels}
                  isFocused={
                    isFocusedSection && focus?.month === cell.month
                  }
                  onFocus={() => setFocus({ sectionId: row.sectionId, month: cell.month })}
                />
              ))}
            </div>
            {!row.hasActivePlan ? (
              <p className="mt-3 text-xs text-[var(--color-muted-foreground)]">{labels.noPlanHint}</p>
            ) : null}

            {row.enrollmentFeeAmount > 0 && row.enrollmentId ? (
              <StudentEnrollmentFeeUpload
                locale={locale}
                studentId={studentId}
                sectionId={row.sectionId}
                enrollmentId={row.enrollmentId}
                receiptStatus={row.enrollmentFeeReceiptStatus}
                receiptSignedUrl={row.enrollmentFeeReceiptSignedUrl}
                labels={labels}
                submitAction={submitEnrollmentFeeReceiptAction}
                onSubmitted={() => router.refresh()}
              />
            ) : null}
          </div>
        );
      })}

      {focusedSection && focusedCell ? (
        <StudentMonthlyPaymentFocus
          locale={locale}
          studentId={studentId}
          section={focusedSection}
          cell={focusedCell}
          monthLabel={monthLabels[focusedCell.month - 1]}
          labels={labels}
          paymentLabels={paymentLabels}
          submitAction={submitAction}
          receiptExpectedUsesFullMonth={receiptExpectedUsesFullMonth}
          onSubmitted={() => router.refresh()}
        />
      ) : null}
    </section>
  );
}
