"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { reviewPulsarOwnerAction } from "@/app/[locale]/admin/ownerReviewAction";
import { Button } from "@/components/atoms/Button";
import type { Dictionary } from "@/types/i18n";

type OwnerRow = { userId: string; email: string; status: "pending" | "approved" | "rejected" };

export function PulsarAdminOwnerReview({
  locale,
  owners,
  copy,
}: {
  locale: string;
  owners: readonly OwnerRow[];
  copy: Dictionary["pulsar"]["admin"]["owners"];
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const groups = (["pending", "approved", "rejected"] as const).map((status) => ({
    status,
    rows: owners.filter((owner) => owner.status === status),
  }));

  async function review(userId: string, decision: "approved" | "rejected") {
    setPendingId(userId);
    await reviewPulsarOwnerAction({ locale, userId, decision });
    setPendingId(null);
    router.refresh();
  }

  return (
    <section className="max-w-xl space-y-6">
      <h2 className="text-lg font-medium">{copy.title}</h2>
      {owners.length === 0 ? <p className="text-sm text-[var(--color-muted-foreground)]">{copy.empty}</p> : null}
      {groups.map((group) => (
        <div key={group.status} className="space-y-2">
          <h3 className="text-sm font-semibold">{copy[group.status]}</h3>
          <ul>
            {group.rows.map((owner) => (
              <li key={owner.userId} className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] py-3">
                <span className="text-sm">{owner.email}</span>
                {group.status === "pending" ? (
                  <span className="flex gap-2">
                    <Button type="button" isLoading={pendingId === owner.userId} onClick={() => review(owner.userId, "approved")}>
                      <Check className="h-4 w-4" aria-hidden />
                      {copy.approve}
                    </Button>
                    <Button type="button" variant="destructive" onClick={() => review(owner.userId, "rejected")}>
                      <X className="h-4 w-4" aria-hidden />
                      {copy.reject}
                    </Button>
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
