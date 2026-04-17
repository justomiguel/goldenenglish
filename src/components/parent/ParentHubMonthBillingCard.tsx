import Link from "next/link";
import type { Dictionary } from "@/types/i18n";
import type { ParentMonthBillingSummary } from "@/lib/parent/loadParentMonthBillingInvoiceSummary";

export interface ParentHubMonthBillingCardProps {
  locale: string;
  summary: ParentMonthBillingSummary;
  dict: Dictionary["dashboard"]["parent"]["monthBilling"];
}

function formatAmount(locale: string, n: number) {
  return new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

export function ParentHubMonthBillingCard({ locale, summary, dict }: ParentHubMonthBillingCardProps) {
  const billingHref = `/${locale}/dashboard/parent/billing`;
  const payHref = `/${locale}/dashboard/parent/payments`;
  const urgent = summary.invoiceCount > 0 || summary.hasPriorOverdue;

  return (
    <section
      className={`rounded-[var(--layout-border-radius)] border p-4 ${
        urgent ? "border-[var(--color-error)] bg-[var(--color-surface)]" : "border-[var(--color-border)] bg-[var(--color-background)]"
      }`}
      aria-label={dict.title}
    >
      <h2 className="text-base font-semibold text-[var(--color-foreground)]">{dict.title}</h2>
      <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
        {dict.lead.replace("{month}", summary.monthTitle)}
      </p>
      {summary.hasPriorOverdue ? (
        <p className="mt-2 text-xs font-medium text-[var(--color-error)]">{dict.priorHint}</p>
      ) : null}
      {summary.invoiceCount === 0 ? (
        <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">{dict.none}</p>
      ) : (
        <p className="mt-3 text-sm font-medium text-[var(--color-foreground)]">
          {dict.countLine
            .replace("{count}", String(summary.invoiceCount))
            .replace("{amount}", formatAmount(locale, summary.totalAmount))}
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href={billingHref}
          className="inline-flex min-h-[44px] items-center rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)] px-4 text-sm font-semibold text-[var(--color-primary)]"
        >
          {dict.ctaFees}
        </Link>
        <Link
          href={payHref}
          className="inline-flex min-h-[44px] items-center rounded-[var(--layout-border-radius)] bg-[var(--color-primary)] px-4 text-sm font-semibold text-[var(--color-primary-foreground)]"
        >
          {dict.ctaPay}
        </Link>
      </div>
    </section>
  );
}
