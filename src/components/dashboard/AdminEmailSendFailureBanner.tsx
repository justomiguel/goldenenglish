"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, MailWarning } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { dismissEmailSendFailureAction } from "@/app/[locale]/dashboard/admin/settings/dismissEmailSendFailureAction";

export function AdminEmailSendFailureBanner({
  locale,
  labels,
}: {
  locale: string;
  labels: Dictionary["admin"]["settings"];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onDismiss() {
    setPending(true);
    const result = await dismissEmailSendFailureAction(locale);
    setPending(false);
    if (result.ok) router.refresh();
  }

  return (
    <div
      role="status"
      className="mb-4 flex flex-col gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-[var(--color-foreground)] sm:flex-row sm:items-start sm:justify-between"
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
          <MailWarning className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <p className="font-semibold text-[var(--color-foreground)]">{labels.emailDeliveryFailureTitle}</p>
          <p className="mt-1 text-[var(--color-foreground)]">{labels.emailDeliveryFailureLead}</p>
          <Link
            href={`/${locale}/dashboard/admin/settings`}
            className="mt-2 inline-block font-medium text-[var(--color-primary)] underline-offset-2 hover:underline"
          >
            {labels.emailDeliveryFailureSettings}
          </Link>
        </div>
      </div>
      <button
        type="button"
        disabled={pending}
        onClick={() => void onDismiss()}
        className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-950 disabled:opacity-60"
      >
        <Check className="h-3.5 w-3.5" aria-hidden />
        {labels.emailDeliveryFailureDismiss}
      </button>
    </div>
  );
}
