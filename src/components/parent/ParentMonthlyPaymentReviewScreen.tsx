"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatStudentMonthlyPaymentAmount } from "@/components/student/studentMonthlyPaymentFocusFormatAmount";
import { ParentMonthlyPaymentReviewPay } from "@/components/parent/ParentMonthlyPaymentReviewPay";
import { monthlyStripMonthLabels } from "@/lib/student/studentMonthlyPaymentsStripState";
import type { PayableParentMonthLine } from "@/lib/billing/listPayableParentMonthSections";
import type { ParentMonthlyPayScope } from "@/lib/billing/listPayableParentMonthSections";
import type {
  SubmitMonthlyReceiptAction,
  StartOnlineMonthlyPaymentClientAction,
} from "@/components/student/StudentMonthlyPaymentFocus";
import type { PaymentGatewayProvider } from "@/types/paymentGateway";
import type { Dictionary, Locale } from "@/types/i18n";
import type { FileUploadProgressLabels } from "@/types/fileUploadProgressLabels";

export interface ParentMonthlyPaymentReviewScreenProps {
  locale: Locale;
  studentId: string;
  originSectionId: string;
  originSectionName: string;
  month: number;
  year: number;
  scope: ParentMonthlyPayScope;
  studentName: string;
  currentLines: PayableParentMonthLine[];
  allLines: PayableParentMonthLine[];
  backHref: string;
  reviewHrefBase: string;
  labels: Dictionary["dashboard"]["parent"]["paymentsReview"];
  studentLabels: Dictionary["dashboard"]["student"];
  fileUploadProgress: FileUploadProgressLabels;
  bankTransferInstructions: string | null;
  enabledOnlineGateways: PaymentGatewayProvider[];
  submitReceiptAction: SubmitMonthlyReceiptAction;
  startFlowAction?: StartOnlineMonthlyPaymentClientAction;
  startMercadoPagoAction?: StartOnlineMonthlyPaymentClientAction;
}

export function ParentMonthlyPaymentReviewScreen({
  locale,
  studentId,
  originSectionId,
  originSectionName,
  month,
  year,
  scope,
  studentName,
  currentLines,
  allLines,
  backHref,
  reviewHrefBase,
  labels,
  studentLabels,
  fileUploadProgress,
  bankTransferInstructions,
  enabledOnlineGateways,
  submitReceiptAction,
  startFlowAction,
  startMercadoPagoAction,
}: ParentMonthlyPaymentReviewScreenProps) {
  const router = useRouter();
  const monthLabel = monthlyStripMonthLabels(locale)[month - 1] ?? String(month);
  const period = labels.periodLabel.replace("{month}", monthLabel).replace("{year}", String(year));
  const showScope = allLines.length >= 2;
  const lines = scope === "all" && showScope ? allLines : currentLines;
  const total = lines.reduce((sum, line) => sum + line.amount, 0);
  const currency = lines[0]?.currency ?? null;

  function hrefForScope(next: ParentMonthlyPayScope): string {
    const url = new URL(reviewHrefBase, "https://local.invalid");
    url.searchParams.set("scope", next);
    return `${url.pathname}?${url.searchParams.toString()}`;
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold text-[var(--color-secondary)]">{labels.title}</h1>
      <p className="text-sm text-[var(--color-muted-foreground)]">
        {labels.lead.replace("{student}", studentName).replace("{period}", period)}
      </p>
      <p>
        <Link
          href={backHref}
          className="text-sm font-medium text-[var(--color-primary)] underline-offset-2 hover:underline"
        >
          {labels.back}
        </Link>
      </p>

      {showScope ? (
        <fieldset className="min-w-0 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <legend className="text-sm font-semibold text-[var(--color-foreground)]">
            {labels.scopeLegend}
          </legend>
          <div role="radiogroup" aria-label={labels.scopeLegend} className="mt-2 space-y-2">
            {(
              [
                ["current", labels.scopeThis.replace("{section}", originSectionName)],
                ["all", labels.scopeAll],
              ] as const
            ).map(([value, label]) => (
              <label
                key={value}
                className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm"
              >
                <input
                  type="radio"
                  name="pay-scope"
                  checked={scope === value}
                  onChange={() => router.push(hrefForScope(value))}
                  className="h-4 w-4"
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      {lines.length === 0 ? (
        <p className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)] px-3 py-2 text-sm text-[var(--color-muted-foreground)]">
          {labels.emptyOrigin}
        </p>
      ) : (
        <>
          <ul className="space-y-2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            {lines.map((line) => (
              <li key={line.sectionId} className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                <span>
                  {line.sectionName}
                  {line.scholarshipDiscountPercent != null ? (
                    <span className="ml-2 text-xs text-[var(--color-muted-foreground)]">
                      {labels.lineScholarship.replace(
                        "{percent}",
                        String(line.scholarshipDiscountPercent),
                      )}
                    </span>
                  ) : null}
                </span>
                <span className="font-medium">
                  {formatStudentMonthlyPaymentAmount(locale, line.amount, line.currency)}
                </span>
              </li>
            ))}
            <li className="flex items-baseline justify-between border-t border-[var(--color-border)] pt-2 text-sm font-semibold">
              <span>{labels.total}</span>
              <span>{formatStudentMonthlyPaymentAmount(locale, total, currency)}</span>
            </li>
          </ul>
          <ParentMonthlyPaymentReviewPay
            locale={locale}
            studentId={studentId}
            originSectionId={originSectionId}
            month={month}
            year={year}
            scope={showScope && scope === "all" ? "all" : "current"}
            total={total}
            studentLabels={studentLabels}
            fileUploadProgress={fileUploadProgress}
            bankTransferInstructions={bankTransferInstructions}
            enabledOnlineGateways={enabledOnlineGateways}
            submitReceiptAction={submitReceiptAction}
            startFlowAction={startFlowAction}
            startMercadoPagoAction={startMercadoPagoAction}
          />
        </>
      )}
    </div>
  );
}
