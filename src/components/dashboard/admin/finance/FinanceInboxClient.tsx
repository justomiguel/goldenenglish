"use client";

import { useState } from "react";
import type { Dictionary, Locale } from "@/types/i18n";
import type { MonthlyReceiptItem, EnrollmentReceiptItem, InvoiceReceiptItem } from "./FinanceInboxPanel";
import { FinanceMonthlyReceiptsBulkSection } from "./FinanceMonthlyReceiptsBulkSection";
import { FinanceEnrollmentReceiptsBulkSection } from "./FinanceEnrollmentReceiptsBulkSection";
import { FinanceInvoiceReceiptsBulkSection } from "./FinanceInvoiceReceiptsBulkSection";

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
  const invoiceQueueDict = dict.admin.finance.invoiceReceiptQueue;
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
        <FinanceEnrollmentReceiptsBulkSection
          items={enrollmentItems}
          locale={locale}
          dict={efQueueDict}
          inboxDict={inboxDict}
          commonDict={{ cancel: dict.common.cancel }}
        />
      ) : null}
      {active === "invoice" ? (
        <FinanceInvoiceReceiptsBulkSection
          items={invoiceItems}
          locale={locale}
          dict={invoiceQueueDict}
          inboxDict={inboxDict}
          viewReceiptLabel={portalBillingDict.viewReceipt}
          commonDict={{ cancel: dict.common.cancel }}
        />
      ) : null}
    </div>
  );
}
