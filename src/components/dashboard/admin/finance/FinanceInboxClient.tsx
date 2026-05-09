"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { Dictionary, Locale } from "@/types/i18n";
import type { MonthlyReceiptItem, EnrollmentReceiptItem, InvoiceReceiptItem } from "./FinanceInboxPanel";
import { FinanceMonthlyReceiptsBulkSection } from "./FinanceMonthlyReceiptsBulkSection";
import { EnrollmentFeeReceiptQueueRow } from "./EnrollmentFeeReceiptQueueRow";
import { InboxAgingChip } from "./InboxAgingChip";

type InboxType = "monthly" | "enrollment" | "invoice";
const TYPES: InboxType[] = ["monthly", "enrollment", "invoice"];

export interface FinanceInboxClientProps {
  monthlyItems: MonthlyReceiptItem[];
  enrollmentItems: EnrollmentReceiptItem[];
  invoiceItems: InvoiceReceiptItem[];
  locale: Locale;
  dict: Dictionary;
  activeType?: string;
}

function EmptyState({ label }: { label: string }) {
  return (
    <p className="rounded-[var(--layout-border-radius)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center text-sm text-[var(--color-muted-foreground)]">
      {label}
    </p>
  );
}

export function FinanceInboxClient({
  monthlyItems,
  enrollmentItems,
  invoiceItems,
  locale,
  dict,
  activeType,
}: FinanceInboxClientProps) {
  const inboxDict = dict.admin.finance.inbox;
  const paymentsDict = dict.admin.payments;
  const efQueueDict = dict.admin.finance.enrollmentFeeQueue;
  const portalBillingDict = dict.dashboard.portalBilling;

  const initial: InboxType =
    activeType && TYPES.includes(activeType as InboxType)
      ? (activeType as InboxType)
      : "monthly";
  const [active, setActive] = useState<InboxType>(initial);

  const counts: Record<InboxType, number> = {
    monthly: monthlyItems.length,
    enrollment: enrollmentItems.length,
    invoice: invoiceItems.length,
  };

  const labels: Record<InboxType, string> = {
    monthly: inboxDict.typeMonthly,
    enrollment: inboxDict.typeEnrollment,
    invoice: inboxDict.typeInvoice,
  };

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h2 className="font-display text-base font-semibold text-[var(--color-primary)]">
          {inboxDict.title}
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-[var(--color-muted-foreground)]">
          {inboxDict.lead}
        </p>
      </header>

      <nav
        aria-label={inboxDict.title}
        className="inline-flex rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-0.5"
      >
        {TYPES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setActive(t)}
            aria-pressed={active === t}
            className={`inline-flex items-center gap-1.5 rounded-[var(--layout-border-radius)] px-3 py-1.5 text-sm font-medium transition ${
              active === t
                ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-sm"
                : "text-[var(--color-foreground)]/70 hover:text-[var(--color-foreground)]"
            }`}
          >
            {labels[t]}
            {counts[t] > 0 ? (
              <span
                aria-hidden
                className={`inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[10px] font-semibold tabular-nums ${
                  active === t
                    ? "bg-[var(--color-primary-foreground)]/20 text-[var(--color-primary-foreground)]"
                    : "bg-[var(--color-error)]/10 text-[var(--color-error)]"
                }`}
              >
                {counts[t]}
              </span>
            ) : null}
          </button>
        ))}
      </nav>

      {active === "monthly" ? (
        <FinanceMonthlyReceiptsBulkSection
          items={monthlyItems}
          locale={locale}
          dict={paymentsDict}
          inboxDict={inboxDict}
          commonDict={{ cancel: dict.common.cancel }}
          emptyValue={dict.common.emptyValue}
        />
      ) : null}
      {active === "enrollment" ? (
        <EnrollmentQueue
          items={enrollmentItems}
          locale={locale}
          dict={efQueueDict}
          inboxDict={inboxDict}
        />
      ) : null}
      {active === "invoice" ? (
        <InvoiceQueue
          items={invoiceItems}
          inboxDict={inboxDict}
          portalBillingDict={portalBillingDict}
        />
      ) : null}
    </div>
  );
}

function EnrollmentQueue({
  items,
  locale,
  dict,
  inboxDict,
}: {
  items: EnrollmentReceiptItem[];
  locale: Locale;
  dict: Dictionary["admin"]["finance"]["enrollmentFeeQueue"];
  inboxDict: Dictionary["admin"]["finance"]["inbox"];
}) {
  if (items.length === 0) return <EmptyState label={inboxDict.empty} />;
  return (
    <div className="space-y-3">
      {items.map((r) => (
        <div key={r.enrollmentId} className="flex items-center gap-2">
          <InboxAgingChip uploadedAt={r.uploadedAt} dict={inboxDict} />
          <div className="flex-1">
            <EnrollmentFeeReceiptQueueRow
              locale={locale}
              enrollmentId={r.enrollmentId}
              studentId={r.studentId}
              studentName={r.studentName}
              sectionName={r.sectionName}
              signedUrl={r.signedUrl}
              uploadedAt={r.uploadedAt}
              dict={dict}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function InvoiceQueue({
  items,
  inboxDict,
  portalBillingDict,
}: {
  items: InvoiceReceiptItem[];
  inboxDict: Dictionary["admin"]["finance"]["inbox"];
  portalBillingDict: Dictionary["dashboard"]["portalBilling"];
}) {
  if (items.length === 0) return <EmptyState label={inboxDict.empty} />;
  return (
    <div className="space-y-3">
      {items.map((r) => (
        <div
          key={r.receiptId}
          className="flex items-center gap-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
        >
          <InboxAgingChip uploadedAt={r.createdAt} dict={inboxDict} />
          <div className="flex flex-1 flex-col gap-0.5 text-sm">
            <span className="font-medium text-[var(--color-foreground)]">
              {r.studentName}
            </span>
            <span className="text-xs text-[var(--color-muted-foreground)]">
              {r.invoiceDescription}
            </span>
          </div>
          <span className="text-sm font-semibold tabular-nums text-[var(--color-foreground)]">
            ${r.amountPaid}
          </span>
          <Link
            href={r.receiptHref}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-primary)] hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            {portalBillingDict.viewReceipt}
          </Link>
        </div>
      ))}
    </div>
  );
}
