import type { Dictionary } from "@/types/i18n";
import type { SectionCollectionsStudentRow } from "@/types/sectionCollections";

type BenefitLabels = Dictionary["admin"]["finance"]["collections"]["benefits"];

function formatPercent(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  }).format(value);
}

function benefitTitle(
  student: SectionCollectionsStudentRow,
  labels: BenefitLabels,
): string | undefined {
  const reason = student.enrollmentFee?.exemptReason?.trim();
  return reason
    ? labels.enrollmentExemptReason.replace("{reason}", reason)
    : undefined;
}

export interface SectionCollectionsStudentBenefitsProps {
  student: SectionCollectionsStudentRow;
  labels: BenefitLabels;
  locale: string;
}

export function SectionCollectionsStudentBenefits({
  student,
  labels,
  locale,
}: SectionCollectionsStudentBenefitsProps) {
  const discount = student.activeScholarshipDiscountPercent;
  const promo = student.activePromotionLabel;
  const enrollmentFee = student.enrollmentFee ?? {
    exempt: false,
    exemptReason: null,
  };
  if (!enrollmentFee.exempt && discount == null && promo == null) {
    return null;
  }

  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {enrollmentFee.exempt ? (
        <span
          title={benefitTitle(student, labels)}
          className="inline-flex items-center rounded-full border border-[var(--color-info)]/40 bg-[var(--color-info)]/10 px-2 py-0.5 text-[10px] font-semibold text-[var(--color-info)]"
        >
          {labels.enrollmentExempt}
        </span>
      ) : null}
      {discount != null ? (
        <span className="inline-flex items-center rounded-full border border-[var(--color-success)]/40 bg-[var(--color-success)]/10 px-2 py-0.5 text-[10px] font-semibold text-[var(--color-success)]">
          {labels.discountActive.replace(
            "{percent}",
            `${formatPercent(discount, locale)}%`,
          )}
        </span>
      ) : null}
      {promo ? (
        <span className="inline-flex items-center rounded-full border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/10 px-2 py-0.5 text-[10px] font-semibold text-[var(--color-accent)]">
          {labels.promotionActive.replace("{name}", promo)}
        </span>
      ) : null}
    </div>
  );
}
