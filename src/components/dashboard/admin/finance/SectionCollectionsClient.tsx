"use client";

import { Bell, Mail, X } from "lucide-react";
import { useMemo, useState } from "react";
import { sendOverdueBalanceRemindersAction } from "@/app/[locale]/dashboard/admin/finance/collections/overdueBalanceRemindersAction";
import { Button } from "@/components/atoms/Button";
import type { SectionCollectionsView } from "@/types/sectionCollections";
import type { Dictionary } from "@/types/i18n";
import { AdminBillingMatrixLegendModal } from "@/components/dashboard/AdminBillingMatrixLegendModal";
import { SectionCollectionsKpisCard } from "./SectionCollectionsKpisCard";
import { SectionCollectionsMatrixTable } from "./SectionCollectionsMatrixTable";
import { SectionCollectionsExportButtons } from "./SectionCollectionsExportButtons";
import { SectionCollectionsBulkMessageModal } from "./SectionCollectionsBulkMessageModal";
import { financeCollectionsMatrixLegendLabels } from "./collectionsMatrixLegendLabels";

type CollectionsDict = Dictionary["admin"]["finance"]["collections"];

export interface SectionCollectionsClientProps {
  view: SectionCollectionsView;
  dict: CollectionsDict;
  locale: string;
  currency?: string;
}

export function SectionCollectionsClient({
  view,
  dict,
  locale,
  currency,
}: SectionCollectionsClientProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [overdueBusy, setOverdueBusy] = useState(false);
  const [overdueNotice, setOverdueNotice] = useState<string | null>(null);

  const overdueIds = useMemo(
    () =>
      view.students.filter((s) => s.hasOverdue).map((s) => s.studentId),
    [view.students],
  );

  function toggleStudent(id: string, next: boolean) {
    setSelectedIds((prev) => {
      const copy = new Set(prev);
      if (next) copy.add(id);
      else copy.delete(id);
      return copy;
    });
  }
  function toggleAll(next: boolean) {
    setSelectedIds(
      next ? new Set(view.students.map((s) => s.studentId)) : new Set(),
    );
  }
  function selectOverdue() {
    setSelectedIds(new Set(overdueIds));
  }
  function clearSelection() {
    setSelectedIds(new Set());
  }

  const selectionCount = selectedIds.size;
  const recipientIds = useMemo(() => Array.from(selectedIds), [selectedIds]);

  const selectedOverdueIds = useMemo(
    () =>
      recipientIds.filter((id) => {
        const s = view.students.find((row) => row.studentId === id);
        return Boolean(s?.hasOverdue);
      }),
    [recipientIds, view.students],
  );

  async function handleSendOverdueReminders() {
    if (selectedOverdueIds.length === 0) {
      setOverdueNotice(dict.matrix.overdueEmailNoneSelected);
      return;
    }
    setOverdueBusy(true);
    setOverdueNotice(null);
    const r = await sendOverdueBalanceRemindersAction({
      locale,
      sectionId: view.sectionId,
      year: view.year,
      recipientIds: selectedOverdueIds,
    });
    setOverdueBusy(false);
    if (r.ok) {
      setOverdueNotice(
        dict.matrix.overdueEmailDone.replace("{sent}", String(r.sent)).replace(
          "{skipped}",
          String(r.skipped),
        ),
      );
    } else {
      setOverdueNotice(dict.matrix.overdueEmailFailed);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <SectionCollectionsKpisCard
        kpis={view.kpis}
        dict={dict}
        locale={locale}
        currency={currency}
      />
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2">
        <div className="flex flex-col gap-2">
          {overdueNotice ? (
            <p className="text-sm text-[var(--color-muted-foreground)]" role="status">
              {overdueNotice}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={selectOverdue}
              disabled={overdueIds.length === 0}
              className="inline-flex min-h-[36px] items-center gap-1 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm font-medium text-[var(--color-foreground)] transition hover:bg-[var(--color-muted)]/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {dict.matrix.selectOverdue}
            </button>
            {selectionCount > 0 ? (
              <>
                <span className="text-sm text-[var(--color-muted-foreground)]">
                  {dict.matrix.selectionCount.replace(
                    "{count}",
                    String(selectionCount),
                  )}
                </span>
                <button
                  type="button"
                  onClick={clearSelection}
                  aria-label={dict.matrix.clearSelection}
                  title={dict.matrix.clearSelection}
                  className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] p-1 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                </button>
                <Button
                  type="button"
                  size="md"
                  variant="primary"
                  isLoading={false}
                  onClick={() => setModalOpen(true)}
                >
                  <Mail className="h-4 w-4" aria-hidden />
                  {dict.bulk.messageTitle}
                </Button>
                <Button
                  type="button"
                  size="md"
                  variant="secondary"
                  isLoading={overdueBusy}
                  onClick={handleSendOverdueReminders}
                >
                  <Bell className="h-4 w-4" aria-hidden />
                  {dict.matrix.sendOverdueEmail}
                </Button>
              </>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <AdminBillingMatrixLegendModal
            labels={financeCollectionsMatrixLegendLabels(dict)}
          />
          <SectionCollectionsExportButtons
            locale={locale}
            sectionId={view.sectionId}
            year={view.year}
            dict={dict}
          />
        </div>
      </div>
      <SectionCollectionsMatrixTable
        view={view}
        dict={dict}
        locale={locale}
        currency={currency}
        selectedIds={selectedIds}
        onToggleStudent={toggleStudent}
        onToggleAll={toggleAll}
      />
      <SectionCollectionsBulkMessageModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        locale={locale}
        sectionId={view.sectionId}
        recipientIds={recipientIds}
        dict={dict}
        onSent={() => clearSelection()}
      />
    </div>
  );
}
