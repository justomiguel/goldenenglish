"use client";

import { formatStudentMonthlyPaymentAmount } from "@/components/student/studentMonthlyPaymentFocusFormatAmount";
import type { Dictionary, Locale } from "@/types/i18n";
import type {
  StudentMonthlyPaymentCell,
  StudentMonthlyPaymentSectionRow,
} from "@/types/studentMonthlyPayments";

type Labels = Dictionary["dashboard"]["student"]["monthly"];

export interface StudentMonthlyPaymentFocusAmountsProps {
  locale: Locale;
  section: StudentMonthlyPaymentSectionRow;
  cell: StudentMonthlyPaymentCell;
  labels: Labels;
  paymentLabels: Dictionary["dashboard"]["student"];
  expected: number | null;
  originalExpected: number | null | undefined;
  hasDiscountedExpected: boolean;
  recordedDisplayAmount: number | null | undefined;
  pwaNestedHierarchy: boolean;
}

export function StudentMonthlyPaymentFocusAmounts({
  locale,
  cell,
  labels,
  paymentLabels,
  expected,
  originalExpected,
  hasDiscountedExpected,
  recordedDisplayAmount,
  pwaNestedHierarchy,
}: StudentMonthlyPaymentFocusAmountsProps) {
  return (
    <dl
      className={
        pwaNestedHierarchy
          ? "grid grid-cols-1 gap-2 text-sm sm:grid-cols-2"
          : "mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2"
      }
    >
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
  );
}
