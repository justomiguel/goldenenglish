"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { Dictionary, Locale } from "@/types/i18n";
import type { InvoiceReceiptItem } from "./FinanceInboxPanel";
import { InboxAgingChip } from "./InboxAgingChip";
import { ConfirmActionModal } from "@/components/molecules/ConfirmActionModal";
import { FinanceInboxBulkToolbar } from "./FinanceInboxBulkToolbar";
import {
  bulkApproveBillingReceipts,
  bulkRejectBillingReceipts,
} from "@/app/[locale]/dashboard/admin/finance/receipts/actions";

function fmtCount(tpl: string, count: number) {
  const s = String(count);
  return tpl.replaceAll("{{count}}", s).replaceAll("{count}", s);
}

export interface FinanceInvoiceReceiptsBulkSectionProps {
  items: InvoiceReceiptItem[];
  locale: Locale;
  dict: Dictionary["admin"]["finance"]["invoiceReceiptQueue"];
  inboxDict: Dictionary["admin"]["finance"]["inbox"];
  viewReceiptLabel: string;
  commonDict: Pick<Dictionary["common"], "cancel">;
}

export function FinanceInvoiceReceiptsBulkSection({
  items,
  locale,
  dict,
  inboxDict,
  viewReceiptLabel,
  commonDict,
}: FinanceInvoiceReceiptsBulkSectionProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);

  const allIds = useMemo(() => items.map((i) => i.receiptId), [items]);
  const allSelected = items.length > 0 && selected.size === items.length;
  const nSel = selected.size;

  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(allIds));
  }

  function toggleOne(receiptId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(receiptId)) next.delete(receiptId);
      else next.add(receiptId);
      return next;
    });
  }

  async function runBulkApprove() {
    if (nSel === 0 || busy) return;
    setBusy(true);
    setBanner(null);
    const r = await bulkApproveBillingReceipts({
      receiptIds: [...selected],
      locale,
    });
    setBusy(false);
    if (!r.ok || r.processed === 0) {
      setBanner(dict.bulkNothingProcessed);
      return;
    }
    setSelected(new Set());
    setBanner(fmtCount(dict.bulkApproveResult, r.processed));
    router.refresh();
  }

  async function confirmBulkReject() {
    if (nSel === 0 || busy) return;
    setBusy(true);
    setBanner(null);
    const r = await bulkRejectBillingReceipts({
      receiptIds: [...selected],
      locale,
      code: "other",
      detail: undefined,
    });
    setBusy(false);
    setRejectOpen(false);
    if (!r.ok || r.processed === 0) {
      setBanner(dict.bulkNothingProcessed);
      return;
    }
    setSelected(new Set());
    setBanner(fmtCount(dict.bulkRejectResult, r.processed));
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
          bulkDestructiveSelected: dict.bulkRejectSelected,
        }}
        destructiveIcon="reject"
        allSelected={allSelected}
        selectedCount={nSel}
        busy={busy}
        onToggleAll={toggleAll}
        onApprove={runBulkApprove}
        onOpenDestructive={() => setRejectOpen(true)}
      />

      {banner ? (
        <p className="text-sm text-[var(--color-muted-foreground)]" role="status">
          {banner}
        </p>
      ) : null}

      <div className="space-y-3">
        {items.map((r) => {
          const rowLabel = dict.bulkSelectRowAria
            .replace("{{student}}", r.studentName)
            .replace("{{invoice}}", r.invoiceDescription);
          return (
            <div
              key={r.receiptId}
              className="flex flex-wrap items-center gap-2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
            >
              <input
                type="checkbox"
                checked={selected.has(r.receiptId)}
                onChange={() => toggleOne(r.receiptId)}
                disabled={busy}
                className="h-4 w-4 shrink-0 rounded border-[var(--color-border)]"
                aria-label={rowLabel}
              />
              <InboxAgingChip uploadedAt={r.createdAt} dict={inboxDict} />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-[var(--color-foreground)]">{r.studentName}</p>
                <p className="text-xs text-[var(--color-muted-foreground)]">{r.invoiceDescription}</p>
              </div>
              <span className="text-sm font-semibold tabular-nums text-[var(--color-foreground)]">
                ${r.amountPaid}
              </span>
              <Link
                href={r.receiptHref}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-muted)]/40"
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                {viewReceiptLabel}
              </Link>
            </div>
          );
        })}
      </div>

      <ConfirmActionModal
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title={dict.bulkRejectConfirmTitle}
        description={dict.bulkRejectConfirmBody}
        cancelLabel={commonDict.cancel}
        confirmLabel={dict.bulkRejectConfirm}
        confirmVariant="destructive"
        busy={busy}
        disableClose={busy}
        onConfirm={confirmBulkReject}
      />
    </div>
  );
}
