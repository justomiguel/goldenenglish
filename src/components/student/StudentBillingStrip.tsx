"use client";

import Link from "next/link";
import type { Dictionary } from "@/types/i18n";

type HubDict = Dictionary["dashboard"]["student"]["hub"];

export interface StudentBillingStripProps {
  locale: string;
  pending: boolean;
  dict: HubDict;
}

export function StudentBillingStrip({ locale, pending, dict }: StudentBillingStripProps) {
  if (!pending) return null;
  const href = `/${locale}/dashboard/student/payments`;
  const feesHref = `/${locale}/dashboard/student/billing`;
  return (
    <div className="rounded-2xl border border-[var(--color-error)] bg-[var(--color-surface)] px-4 py-3 text-sm">
      <p className="font-semibold text-[var(--color-error)]">{dict.billingPendingTitle}</p>
      <div className="mt-2 flex flex-wrap gap-3">
        <Link href={href} className="font-medium text-[var(--color-primary)] underline">
          {dict.billingPendingCta}
        </Link>
        <Link href={feesHref} className="font-medium text-[var(--color-primary)] underline">
          {dict.billingFeesCta}
        </Link>
      </div>
    </div>
  );
}
