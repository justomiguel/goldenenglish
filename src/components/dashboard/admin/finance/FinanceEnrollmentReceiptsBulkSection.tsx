"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Dictionary, Locale } from "@/types/i18n";
import type { EnrollmentReceiptItem } from "./FinanceInboxPanel";
import { InboxAgingChip } from "./InboxAgingChip";
import { EnrollmentFeeReceiptQueueRow } from "./EnrollmentFeeReceiptQueueRow";
import { ConfirmActionModal } from "@/components/molecules/ConfirmActionModal";
import { FinanceInboxBulkToolbar } from "./FinanceInboxBulkToolbar";
import { bulkReviewEnrollmentFeeReceipts } from "@/app/[locale]/dashboard/admin/users/[userId]/billing/bulkReviewEnrollmentFeeReceiptsAction";

function fmtCount(tpl: string, count: number) {
  const s = String(count);
  return tpl.replaceAll("{{count}}", s).replaceAll("{count}", s);
}

export interface FinanceEnrollmentReceiptsBulkSectionProps {
  items: EnrollmentReceiptItem[];
  locale: Locale;
  dict: Dictionary["admin"]["finance"]["enrollmentFeeQueue"];
  inboxDict: Dictionary["admin"]["finance"]["inbox"];
  commonDict: Pick<Dictionary["common"], "cancel">;
}

export function FinanceEnrollmentReceiptsBulkSection({
  items,
  locale,
  dict,
  inboxDict,
  commonDict,
}: FinanceEnrollmentReceiptsBulkSectionProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);

  const allIds = useMemo(() => items.map((i) => i.enrollmentId), [items]);
  const allSelected = items.length > 0 && selected.size === items.length;
  const nSel = selected.size;

  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(allIds));
  }

  function toggleOne(enrollmentId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(enrollmentId)) next.delete(enrollmentId);
      else next.add(enrollmentId);
      return next;
    });
  }

  async function runBulkApprove() {
    if (nSel === 0 || busy) return;
    setBusy(true);
    setBanner(null);
    const payloads = [...selected].map((enrollmentId) => {
      const row = items.find((i) => i.enrollmentId === enrollmentId);
      return row
        ? { studentId: row.studentId, enrollmentId }
        : null;
    }).filter(Boolean) as { studentId: string; enrollmentId: string }[];
    const r = await bulkReviewEnrollmentFeeReceipts({
      locale,
      decision: "approved",
      items: payloads,
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
    const payloads = [...selected].map((enrollmentId) => {
      const row = items.find((i) => i.enrollmentId === enrollmentId);
      return row ? { studentId: row.studentId, enrollmentId } : null;
    }).filter(Boolean) as { studentId: string; enrollmentId: string }[];
    const r = await bulkReviewEnrollmentFeeReceipts({
      locale,
      decision: "rejected",
      items: payloads,
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
            .replace("{{section}}", r.sectionName);
          return (
            <div key={r.enrollmentId}>
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={selected.has(r.enrollmentId)}
                  onChange={() => toggleOne(r.enrollmentId)}
                  disabled={busy}
                  className="mt-3 h-4 w-4 shrink-0 rounded border-[var(--color-border)]"
                  aria-label={rowLabel}
                />
                <InboxAgingChip uploadedAt={r.uploadedAt} dict={inboxDict} />
                <div className="min-w-0 flex-1">
                  <EnrollmentFeeReceiptQueueRow
                    locale={locale}
                    enrollmentId={r.enrollmentId}
                    studentId={r.studentId}
                    studentName={r.studentName}
                    sectionName={r.sectionName}
                    signedUrl={r.signedUrl}
                    uploadedAt={r.uploadedAt}
                    dict={dict}
                  />
                </div>
              </div>
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
