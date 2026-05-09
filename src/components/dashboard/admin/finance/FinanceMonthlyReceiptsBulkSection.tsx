"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Dictionary, Locale } from "@/types/i18n";
import type { MonthlyReceiptItem } from "./FinanceInboxPanel";
import { InboxAgingChip } from "./InboxAgingChip";
import { PaymentReviewRow } from "@/components/dashboard/PaymentReviewRow";
import { ConfirmActionModal } from "@/components/molecules/ConfirmActionModal";
import { FinanceInboxBulkToolbar } from "./FinanceInboxBulkToolbar";
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
    setBanner(
      dict.bulkApproveResult
        .replaceAll("{{count}}", String(r.processed))
        .replaceAll("{count}", String(r.processed)),
    );
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
    setBanner(
      dict.bulkDeleteResult
        .replaceAll("{{count}}", String(r.deleted))
        .replaceAll("{count}", String(r.deleted)),
    );
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
      <FinanceInboxBulkToolbar
        labels={{
          bulkSelectAllAria: dict.bulkSelectAllAria,
          bulkSelectAll: dict.bulkSelectAll,
          bulkClearSelection: dict.bulkClearSelection,
          bulkSelectedCount: dict.bulkSelectedCount,
          bulkApproveSelected: dict.bulkApproveSelected,
          bulkDestructiveSelected: dict.bulkDeleteSelected,
        }}
        destructiveIcon="delete"
        allSelected={allSelected}
        selectedCount={nSel}
        busy={busy}
        onToggleAll={toggleAll}
        onApprove={runBulkApprove}
        onOpenDestructive={() => setDeleteOpen(true)}
      />

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
