"use client";

import Link from "next/link";
import type { Dictionary } from "@/types/i18n";

type HubDict = Dictionary["dashboard"]["parent"]["hub"];

export interface ParentHubBillingCardProps {
  locale: string;
  studentId: string | undefined;
  pending: boolean;
  payHrefBase: string;
  dict: HubDict;
}

export function ParentHubBillingCard({ locale, studentId, pending, payHrefBase, dict }: ParentHubBillingCardProps) {
  const href =
    studentId != null
      ? `${payHrefBase}?child=${encodeURIComponent(studentId)}`
      : `/${locale}/dashboard/parent/payments`;

  return (
    <section
      className={`rounded-[var(--layout-border-radius)] border p-4 ${
        pending
          ? "border-[var(--color-error)] bg-[var(--color-surface)]"
          : "border-[var(--color-border)] bg-[var(--color-background)]"
      }`}
    >
      <h2 className="text-base font-semibold text-[var(--color-foreground)]">{dict.billingTitle}</h2>
      <p className={`mt-2 text-sm font-medium ${pending ? "text-[var(--color-error)]" : "text-[var(--color-primary)]"}`}>
        {pending ? dict.billingPending : dict.billingOk}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Link
          href={href}
          className="inline-flex min-h-[44px] items-center rounded-[var(--layout-border-radius)] bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary-foreground)]"
        >
          {dict.billingPayCta}
        </Link>
        <Link
          href={`/${locale}/dashboard/parent/billing`}
          className="inline-flex min-h-[44px] items-center rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-primary)]"
        >
          {dict.billingFeesCta}
        </Link>
      </div>
    </section>
  );
}
