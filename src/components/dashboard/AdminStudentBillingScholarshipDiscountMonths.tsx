import type { AdminBillingScholarship } from "@/types/adminStudentBilling";
import type { Dictionary } from "@/types/i18n";

type BillingLabels = Dictionary["admin"]["billing"];

interface AdminStudentBillingScholarshipDiscountMonthsProps {
  scholarship: NonNullable<AdminBillingScholarship>;
  labels: BillingLabels;
}

function periodIndex(year: number, month: number): number {
  return year * 12 + month;
}

function formatMonthYear(month: number, year: number): string {
  return `${String(month).padStart(2, "0")}/${year}`;
}

function discountMonths(scholarship: NonNullable<AdminBillingScholarship>) {
  if (
    scholarship.valid_until_year == null ||
    scholarship.valid_until_month == null
  ) {
    return null;
  }
  const start = periodIndex(
    scholarship.valid_from_year,
    scholarship.valid_from_month,
  );
  const end = periodIndex(
    scholarship.valid_until_year,
    scholarship.valid_until_month,
  );
  if (end < start) return [];

  const months: Array<{ month: number; year: number }> = [];
  for (let idx = start; idx <= end; idx += 1) {
    const year = Math.floor((idx - 1) / 12);
    const month = idx - year * 12;
    months.push({ month, year });
  }
  return months;
}

export function AdminStudentBillingScholarshipDiscountMonths({
  scholarship,
  labels,
}: AdminStudentBillingScholarshipDiscountMonthsProps) {
  const months = discountMonths(scholarship);
  return (
    <div className="mt-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
        {labels.scholarshipDiscountMonthsTitle}
      </p>
      {months == null ? (
        <p className="mt-2 text-sm text-[var(--color-foreground)]">
          {labels.scholarshipDiscountMonthsOngoing
            .replace(
              "{from}",
              formatMonthYear(
                scholarship.valid_from_month,
                scholarship.valid_from_year,
              ),
            )
            .replace("{percent}", String(scholarship.discount_percent))}
        </p>
      ) : (
        <div className="mt-2 flex flex-wrap gap-2">
          {months.map((period) => (
            <span
              key={`${period.year}-${period.month}`}
              className="rounded-full border border-[var(--color-info)] bg-[var(--color-info)]/10 px-3 py-1 text-xs font-medium text-[var(--color-foreground)]"
            >
              {labels.scholarshipDiscountMonthItem
                .replace("{period}", formatMonthYear(period.month, period.year))
                .replace("{percent}", String(scholarship.discount_percent))}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
