"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { ConfirmActionModal } from "@/components/molecules/ConfirmActionModal";
import { removeAnnualSettlementAction } from "@/app/[locale]/dashboard/admin/users/[userId]/billing/annualTuitionSettlementActions";
import type { Dictionary } from "@/types/i18n";
import type { Locale } from "@/types/i18n";
import type { AdminBillingAnnualSettlement } from "@/types/adminStudentBilling";
import { formatAnnualSettlementExistingLine } from "@/components/dashboard/adminAnnualSettlementFormatters";

export interface AdminAnnualSettlementExistingListProps {
  locale: Locale;
  studentId: string;
  sectionId: string;
  settlements: readonly AdminBillingAnnualSettlement[];
  labels: Dictionary["admin"]["billing"]["annualSettlement"];
  formatMoney: (amount: number, currency: string) => string;
  cancelLabel: string;
}

export function AdminAnnualSettlementExistingList({
  locale,
  studentId,
  sectionId,
  settlements,
  labels,
  formatMoney,
  cancelLabel,
}: AdminAnnualSettlementExistingListProps) {
  const router = useRouter();
  const [pendingRemove, setPendingRemove] = useState<AdminBillingAnnualSettlement | null>(null);
  const [removeBusy, setRemoveBusy] = useState(false);
  const [removeBanner, setRemoveBanner] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const runRemove = async () => {
    if (!pendingRemove) return;
    setRemoveBusy(true);
    setRemoveBanner(null);
    try {
      const r = await removeAnnualSettlementAction({
        locale,
        studentId,
        sectionId,
        settlementId: pendingRemove.id,
      });
      if (!r.ok) {
        setRemoveBanner({ kind: "err", text: r.message ?? labels.removeErrorGeneric });
        return;
      }
      setPendingRemove(null);
      setRemoveBanner({ kind: "ok", text: r.message ?? labels.removeSuccess });
      router.refresh();
    } finally {
      setRemoveBusy(false);
    }
  };

  if (settlements.length === 0) return null;
  return (
    <div className="rounded-[var(--layout-border-radius)] bg-[var(--color-muted)]/25 p-3 text-sm">
      <p className="font-medium text-[var(--color-foreground)]">{labels.existingTitle}</p>
      <ul className="mt-2 list-inside list-disc space-y-2 text-[var(--color-muted-foreground)]">
        {settlements.map((s) => (
          <li key={s.id} className="list-none">
            <div className="flex flex-wrap items-start justify-between gap-2 rounded-md bg-[var(--color-surface)]/60 p-2">
              <span className="min-w-0 flex-1 text-[var(--color-muted-foreground)]">
                {formatAnnualSettlementExistingLine({ settlement: s, labels, formatMoney })}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="shrink-0 border border-[var(--color-border)] text-[var(--color-error)] hover:bg-[var(--color-muted)]/40"
                onClick={() => {
                  setRemoveBanner(null);
                  setPendingRemove(s);
                }}
              >
                <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
                {labels.removeSettlement}
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs leading-relaxed text-[var(--color-muted-foreground)]">
        {labels.existingFootnote}
      </p>
      {removeBanner ? (
        <p
          role="status"
          className={
            removeBanner.kind === "ok"
              ? "mt-2 text-sm font-medium text-[var(--color-foreground)]"
              : "mt-2 text-sm font-medium text-[var(--color-error)]"
          }
        >
          {removeBanner.text}
        </p>
      ) : null}

      <ConfirmActionModal
        open={pendingRemove !== null}
        onOpenChange={(open) => {
          if (!open && !removeBusy) setPendingRemove(null);
        }}
        title={labels.removeConfirmTitle}
        description={labels.removeConfirmDescription}
        cancelLabel={cancelLabel}
        confirmLabel={labels.removeSettlement}
        confirmVariant="destructive"
        busy={removeBusy}
        disableClose={removeBusy}
        onConfirm={() => void runRemove()}
      />
    </div>
  );
}
