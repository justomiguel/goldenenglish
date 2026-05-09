import type { Dictionary, Locale } from "@/types/i18n";
import { formatStudentMonthlyPaymentAmount } from "@/components/student/studentMonthlyPaymentFocusFormatAmount";
import type {
  StudentMonthlyPaymentCell,
  StudentMonthlyPaymentSectionRow,
} from "@/types/studentMonthlyPayments";

type Labels = Dictionary["dashboard"]["student"]["monthly"];

export interface StudentMonthlyPaymentFocusSummaryProps {
  locale: Locale;
  labels: Labels;
  paymentLabels: Dictionary["dashboard"]["student"];
  section: StudentMonthlyPaymentSectionRow;
  cell: StudentMonthlyPaymentCell;
  monthLabel: string;
  expected: number | null;
  originalExpected: number | null;
  hasDiscountedExpected: boolean;
  recordedDisplayAmount: number | null | undefined;
  isLocked: boolean;
}

export function StudentMonthlyPaymentFocusSummary({
  locale,
  labels,
  paymentLabels,
  section,
  cell,
  monthLabel,
  expected,
  originalExpected,
  hasDiscountedExpected,
  recordedDisplayAmount,
  isLocked,
}: StudentMonthlyPaymentFocusSummaryProps) {
  return (
    <>
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
    </>
  );
}
