"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { reviewEventShareAction } from "@/app/[locale]/admin/eventShareActions";
import type { EventShareQueueRow } from "@/lib/events/server/loadEventShareQueue";
import type { Dictionary } from "@/types/i18n";

interface PulsarAdminEventShareQueueProps {
  locale: string;
  rows: EventShareQueueRow[];
  copy: Dictionary["pulsar"]["admin"];
}

export function PulsarAdminEventShareQueue({ locale, rows, copy }: PulsarAdminEventShareQueueProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function review(grantId: string, decision: "approve" | "reject") {
    setPendingId(grantId);
    setMessage("");
    const result = await reviewEventShareAction({ locale, grantId, decision });
    setPendingId(null);
    if (!result.ok) {
      setMessage(copy.sharesReviewFailed);
      return;
    }
    router.refresh();
  }

  return (
    <section className="mt-6 space-y-4">
      <p className="text-sm text-[var(--color-muted-foreground)]">{copy.sharesLead}</p>
      {rows.length === 0 ? <p className="text-sm text-[var(--color-foreground)]">{copy.sharesEmpty}</p> : null}
      <ul className="space-y-3">
        {rows.map((row) => (
          <li
            key={row.grantId}
            className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
          >
            <p className="text-sm font-semibold text-[var(--color-foreground)]">
              {row.ownerName} · {row.eventTitle} · {row.guestName}
            </p>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              {row.kind === "unshare" ? copy.sharesKindUnshare : copy.sharesKindShare}
            </p>
            {row.titleCode ? (
              <p className="text-sm text-[var(--color-foreground)]">{copy.sharesTitleUnavailable}</p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                className="min-h-11"
                disabled={pendingId === row.grantId}
                onClick={() => void review(row.grantId, "approve")}
              >
                <Check className="h-4 w-4" aria-hidden />
                {copy.sharesApprove}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="min-h-11"
                disabled={pendingId === row.grantId}
                onClick={() => void review(row.grantId, "reject")}
              >
                <X className="h-4 w-4" aria-hidden />
                {copy.sharesReject}
              </Button>
            </div>
          </li>
        ))}
      </ul>
      {message ? <p className="text-sm text-[var(--color-foreground)]">{message}</p> : null}
    </section>
  );
}
