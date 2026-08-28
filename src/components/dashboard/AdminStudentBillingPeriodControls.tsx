import { Input } from "@/components/atoms/Input";
import { AdminBillingSectionFeeSummary } from "@/components/dashboard/AdminBillingSectionFeeSummary";
import { DEFAULT_SECTION_FEE_PLAN_CURRENCY } from "@/types/sectionFeePlan";
import type { AdminStudentBillingSectionBenefit } from "@/types/adminStudentBilling";
import type { Dictionary, Locale } from "@/types/i18n";

type BillingLabels = Dictionary["admin"]["billing"];

export function AdminStudentBillingPeriodControls(props: {
  locale: Locale;
  labels: BillingLabels;
  sectionBenefits: AdminStudentBillingSectionBenefit[];
  selectedSectionId: string;
  onSelectSection: (sectionId: string) => void;
  selectedBenefit: AdminStudentBillingSectionBenefit | null;
  effectiveMonthlyAmount: number | null;
  billingYearRaw: string;
  onBillingYearRawChange: (raw: string) => void;
  paidMonths: number;
  monthCount: number;
  selectableMonths: number;
}) {
  const { labels, sectionBenefits, selectedBenefit } = props;
  return (
    <div className="grid min-w-0 gap-3 md:grid-cols-[minmax(0,1fr)_140px_auto] md:items-start">
      {sectionBenefits.length > 0 ? (
        <div className="min-w-0 space-y-3">
          <div>
            <label
              htmlFor="billing-section-select"
              className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]"
            >
              {labels.sectionBenefitSelect}
            </label>
            <select
              id="billing-section-select"
              value={props.selectedSectionId}
              disabled={sectionBenefits.length === 1}
              onChange={(event) => props.onSelectSection(event.target.value)}
              className="mt-1 min-h-[44px] w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm text-[var(--color-foreground)] disabled:opacity-70"
            >
              {sectionBenefits.map((section) => (
                <option key={section.sectionId} value={section.sectionId}>
                  {section.sectionName}
                </option>
              ))}
            </select>
          </div>
          {selectedBenefit ? (
            <AdminBillingSectionFeeSummary
              locale={props.locale}
              enrollmentAmount={selectedBenefit.sectionEnrollmentFeeAmount}
              enrollmentCurrency={
                selectedBenefit.sectionMonthlyFeeCurrency ?? DEFAULT_SECTION_FEE_PLAN_CURRENCY
              }
              monthlyAmount={selectedBenefit.sectionMonthlyFeeAmount}
              monthlyCurrency={selectedBenefit.sectionMonthlyFeeCurrency}
              effectiveMonthlyAmount={props.effectiveMonthlyAmount}
              labels={{
                enrollmentLabel: labels.billingFeeSummaryEnrollmentLabel,
                monthlyLabel: labels.billingFeeSummaryMonthlyLabel,
                monthlyUnavailable: labels.billingFeeSummaryMonthlyUnavailable,
                enrollmentNotCharged: labels.billingFeeSummaryEnrollmentNotCharged,
              }}
            />
          ) : null}
        </div>
      ) : null}
      <div>
        <label
          htmlFor="billing-year-select"
          className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]"
        >
          {labels.periodYear}
        </label>
        <Input
          id="billing-year-select"
          type="number"
          min={2000}
          max={2100}
          value={props.billingYearRaw}
          onChange={(event) => props.onBillingYearRawChange(event.target.value)}
          className="mt-1 min-h-[44px] w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm text-[var(--color-foreground)]"
        />
      </div>
      <p className="rounded-[var(--layout-border-radius)] bg-[var(--color-muted)]/35 px-3 py-2 text-sm font-semibold text-[var(--color-secondary)]">
        {labels.billingMonthSummary
          .replace("{paid}", String(props.paidMonths))
          .replace("{total}", String(props.monthCount))
          .replace("{open}", String(props.selectableMonths))}
      </p>
    </div>
  );
}
