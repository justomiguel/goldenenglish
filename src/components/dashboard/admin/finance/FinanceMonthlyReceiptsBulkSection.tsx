"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckSquare, Square, Check, Trash2 } from "lucide-react";
import type { Dictionary, Locale } from "@/types/i18n";
import type { MonthlyReceiptItem } from "./FinanceInboxPanel";
import { InboxAgingChip } from "./InboxAgingChip";
import { PaymentReviewRow } from "@/components/dashboard/PaymentReviewRow";
import { Button } from "@/components/atoms/Button";
import { ConfirmActionModal } from "@/components/molecules/ConfirmActionModal";
import {
  bulkDeletePendingMonthlyPayments,
  bulkReviewMonthlyPayments,
} from "@/app/[locale]/dashboard/admin/payments/actions";

export interface FinanceMonthlyReceiptsBulkSectionProps {
  items: MonthlyReceiptItem[];
  locale: Locale;
  dict: Dictionary["admin"]["payments"];
  inboxDict: Dictionary["admin"]["finance"]["inbox"];
  commonDict: Pick<Dictionary["common"], "cancel">;
  emptyValue: string;
}

export function FinanceMonthlyReceiptsBulkSection({
  items,
  locale,
  dict,
  inboxDict,
  commonDict,
  emptyValue,
}: FinanceMonthlyReceiptsBulkSectionProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const allIds = useMemo(() => items.map((i) => i.id), [items]);
  const allSelected = items.length > 0 && selected.size === items.length;
  const nSel = selected.size;

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(allIds));
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function runBulkApprove() {
    if (nSel === 0 || busy) return;
    setBusy(true);
    setBanner(null);
    const r = await bulkReviewMonthlyPayments({
      paymentIds: [...selected],
      status: "approved",
      locale,
    });
    setBusy(false);
    if (!r.ok || r.processed === 0) {
      setBanner(dict.bulkNothingProcessed);
      return;
    }
    setSelected(new Set());
    setBanner(dict.bulkApproveResult.replace("{count}", String(r.processed)));
    router.refresh();
  }

  async function confirmBulkDelete() {
    if (nSel === 0 || busy) return;
    setBusy(true);
    setBanner(null);
    const r = await bulkDeletePendingMonthlyPayments({
      paymentIds: [...selected],
      locale,
    });
    setBusy(false);
    setDeleteOpen(false);
    if (!r.ok || r.deleted === 0) {
      setBanner(r.message ?? dict.bulkNothingProcessed);
      return;
    }
    setSelected(new Set());
    setBanner(dict.bulkDeleteResult.replace("{count}", String(r.deleted)));
    router.refresh();
  }

  if (items.length === 0) {
    return (
      <p className="rounded-[var(--layout-border-radius)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center text-sm text-[var(--color-muted-foreground)]">
        {inboxDict.empty}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/20 p-3">
        <button
          type="button"
          onClick={toggleAll}
          disabled={busy}
          aria-pressed={allSelected}
          aria-label={dict.bulkSelectAllAria}
          className="inline-flex min-h-[36px] shrink-0 items-center gap-2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-muted)]/30 disabled:opacity-50"
        >
          {allSelected ? (
            <CheckSquare className="h-3.5 w-3.5 shrink-0" aria-hidden />
          ) : (
            <Square className="h-3.5 w-3.5 shrink-0" aria-hidden />
          )}
          {allSelected ? dict.bulkClearSelection : dict.bulkSelectAll}
        </button>
        <span className="text-sm text-[var(--color-muted-foreground)]">
          {dict.bulkSelectedCount.replace("{count}", String(nSel))}
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button
            type="button"
            variant="primary"
            size="sm"
            className="min-h-[36px]"
            disabled={busy || nSel === 0}
            onClick={runBulkApprove}
          >
            <Check className="h-4 w-4" aria-hidden />
            {dict.bulkApproveSelected}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="min-h-[36px] border-[var(--color-error)] text-[var(--color-error)]"
            disabled={busy || nSel === 0}
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            {dict.bulkDeleteSelected}
          </Button>
        </div>
      </div>

      {banner ? (
        <p className="text-sm text-[var(--color-muted-foreground)]" role="status">
          {banner}
        </p>
      ) : null}

      <ul className="m-0 list-none space-y-3 p-0">
        {items.map((r) => {
          const rowLabel = dict.bulkSelectRowAria
            .replace("{{student}}", r.studentName)
            .replace("{{period}}", r.periodLabel);
          return (
            <li key={r.id} className="list-none">
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={selected.has(r.id)}
                  onChange={() => toggleOne(r.id)}
                  disabled={busy}
                  className="mt-3 h-4 w-4 shrink-0 rounded border-[var(--color-border)]"
                  aria-label={rowLabel}
                />
                <InboxAgingChip uploadedAt={r.uploadedAt} dict={inboxDict} />
                <div className="min-w-0 flex-1">
                  <PaymentReviewRow
                    locale={locale}
                    paymentId={r.id}
                    studentLabel={r.studentName}
                    periodLabel={r.periodLabel}
                    amountLabel={r.amount != null ? String(r.amount) : emptyValue}
                    previewUrl={r.signedUrl}
                    labels={dict}
                    emptyValue={emptyValue}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <ConfirmActionModal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={dict.bulkDeleteConfirmTitle}
        description={dict.bulkDeleteConfirmBody}
        cancelLabel={commonDict.cancel}
        confirmLabel={dict.bulkDeleteConfirm}
        confirmVariant="destructive"
        busy={busy}
        disableClose={busy}
        onConfirm={confirmBulkDelete}
      />
    </div>
  );
}
