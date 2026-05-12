import Link from "next/link";
import { Download } from "lucide-react";
import type { PaymentReceiptModel } from "@/lib/billing/buildPaymentReceiptModel";

export interface PaymentReceiptHtmlProps {
  receipt: PaymentReceiptModel;
  /** URL to the PDF download endpoint, e.g. `/api/payments/<id>/receipt.pdf`. */
  downloadHref: string;
  downloadLabel: string;
}

/**
 * On-screen rendering of the payment receipt. Tokens-only styling (`01-design-system`); the same
 * data set feeds the PDF document so screen and download stay aligned.
 */
export function PaymentReceiptHtml({ receipt, downloadHref, downloadLabel }: PaymentReceiptHtmlProps) {
  const { tenant, labels, payment, payer, student, receipt: r } = receipt;

  return (
    <section
      className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]"
      aria-labelledby="payment-receipt-heading"
    >
      <header className="flex items-start justify-between gap-3 border-b border-[var(--color-border)] pb-4">
        <div className="flex items-start gap-3 min-w-0">
          {tenant.logoUrl ? (
            // Tenant logo URL is dynamic / external; avoid next/image remotePatterns churn for receipts.
            // eslint-disable-next-line @next/next/no-img-element -- receipt uses arbitrary branded asset URLs
            <img
              src={tenant.logoUrl}
              alt=""
              aria-hidden
              className="h-12 w-12 shrink-0 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] object-contain p-1"
            />
          ) : null}
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-[var(--color-muted-foreground)]">{tenant.name}</p>
            <p className="font-display text-lg font-semibold text-[var(--color-foreground)] truncate">
              {tenant.legalName}
            </p>
            {tenant.legalRegistry ? (
              <p className="text-xs text-[var(--color-muted-foreground)]">{tenant.legalRegistry}</p>
            ) : null}
          </div>
        </div>
        <div className="text-right">
          <h2
            id="payment-receipt-heading"
            className="font-display text-base font-bold text-[var(--color-secondary)]"
          >
            {receipt.documentTitle}
          </h2>
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
            {labels.receiptNumber}: <span className="font-mono">{r.number}</span>
          </p>
          <p className="text-xs text-[var(--color-muted-foreground)]">
            {labels.issuedAt}: {r.issuedAtFormatted}
          </p>
        </div>
      </header>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <ReceiptField label={labels.student} value={student.fullName} />
        <ReceiptField
          label={payer.paidByTutor ? labels.paidByTutor : labels.payer}
          value={payer.fullName}
          hint={payer.email ?? undefined}
        />
        <ReceiptField label={labels.description} value={payment.description} />
        {payment.periodLabel ? <ReceiptField label={labels.period} value={payment.periodLabel} /> : null}
        {payment.sectionLabel ? <ReceiptField label={labels.section} value={payment.sectionLabel} /> : null}
        <ReceiptField label={labels.method} value={r.methodLabel} />
        <ReceiptField label={labels.paidAt} value={r.paidAtFormatted} />
      </dl>

      <div className="mt-4 flex items-center justify-between rounded-md border border-[var(--color-border)] bg-[var(--color-muted)] px-4 py-3">
        <span className="text-sm text-[var(--color-muted-foreground)]">{labels.amount}</span>
        <span className="font-display text-xl font-bold text-[var(--color-primary)]">
          {payment.amountFormatted}
        </span>
      </div>

      <footer className="mt-4 flex flex-col gap-3 border-t border-[var(--color-border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-[var(--color-muted-foreground)]">
          {tenant.address ? `${tenant.address} · ` : ""}
          {tenant.email}
          {tenant.phone ? ` · ${tenant.phone}` : ""}
        </p>
        <Link
          href={downloadHref}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[var(--layout-border-radius)] border-2 border-[var(--color-primary)] bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary-foreground)] transition-colors hover:bg-[var(--color-primary-dark)]"
        >
          <Download className="h-4 w-4 shrink-0" aria-hidden />
          {downloadLabel}
        </Link>
      </footer>

      <p className="mt-3 text-[11px] italic text-[var(--color-muted-foreground)]">{receipt.legalNotice}</p>
    </section>
  );
}

function ReceiptField({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs uppercase tracking-wide text-[var(--color-muted-foreground)]">{label}</dt>
      <dd className="text-sm font-medium text-[var(--color-foreground)] truncate">{value}</dd>
      {hint ? <p className="text-xs text-[var(--color-muted-foreground)] truncate">{hint}</p> : null}
    </div>
  );
}
